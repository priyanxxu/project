import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, CalendarDays, Plus, SlidersHorizontal } from 'lucide-react';
import PageShell from '../components/PageShell';
import { clubAPI } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Literary', 'Entrepreneurship', 'Social', 'Photography', 'Music', 'Other'];

export default function Clubs() {
  const { currentUser } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    clubAPI.getClubs({ q, category: category === 'All' ? '' : category, sort })
      .then(r => setClubs(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, category, sort]);
  useEffect(() => {
    const refresh = () => load();
    const memberRefresh = ({ clubId, memberCount }) => setClubs(prev => prev.map(c => String(c._id) === String(clubId) ? { ...c, memberCount } : c));
    socket.on('club:created', refresh);
    socket.on('club:updated', refresh);
    socket.on('club:deleted', refresh);
    socket.on('club:member-count', memberRefresh);
    return () => {
      socket.off('club:created', refresh);
      socket.off('club:updated', refresh);
      socket.off('club:deleted', refresh);
      socket.off('club:member-count', memberRefresh);
    };
  }, [q, category, sort]);

  const visible = useMemo(() => clubs, [clubs]);

  return (
    <PageShell>
      <section className="container-page py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-primary">Campus communities</p>
            <h1 className="mt-2 text-4xl font-black">Discover campus clubs</h1>
            <p className="mt-3 max-w-2xl text-gray-500">Join real communities, meet students with shared interests and discover club-led events.</p>
          </div>
          {currentUser && (
            <Link to="/clubs/create" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"><Plus size={17}/> Create Club</Link>
          )}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={q} onChange={e => setQ(e.target.value)} className="w-full rounded-xl border bg-white py-3 pl-11 pr-4 outline-none focus:border-primary" placeholder="Search clubs..." />
          </label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold outline-none">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-xl border bg-white px-3">
            <SlidersHorizontal size={16} className="text-gray-500"/>
            <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent py-3 text-sm font-semibold outline-none">
              <option value="newest">Newest</option><option value="members">Most members</option><option value="name">Name A–Z</option><option value="oldest">Oldest</option>
            </select>
          </label>
        </div>

        {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        {loading ? <p className="mt-8 text-sm text-gray-500">Loading clubs from CampusPulse...</p> :
          !visible.length ? <div className="mt-10 rounded-2xl border bg-white p-10 text-center"><p className="font-bold">No clubs found.</p><p className="mt-2 text-sm text-gray-500">Try another search or create the first club.</p></div> :
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(club => <ClubCard key={club._id} club={club} />)}
          </div>
        }
      </section>
    </PageShell>
  );
}

function ClubCard({ club }) {
  return <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
    <div className="h-32 overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100">
      {(club.coverImage || club.logo) ? <img src={club.coverImage || club.logo} alt={`${club.name} cover`} className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center text-4xl">🏫</div>}
    </div>
    <div className="p-6">
      <div className="-mt-12 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-violet-50 text-2xl shadow">
        {club.logo ? <img src={club.logo} alt={`${club.name} logo`} className="h-full w-full object-cover" /> : '✦'}
      </div>
      <span className="mt-4 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-primary">{club.category}</span>
      <h2 className="mt-3 text-xl font-black">{club.name}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">{club.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
        <span className="rounded-xl bg-gray-50 p-3"><Users size={14} className="mr-1 inline text-primary"/>{club.memberCount || 0} members</span>
        <span className="rounded-xl bg-gray-50 p-3"><CalendarDays size={14} className="mr-1 inline text-primary"/>Club events</span>
      </div>
      <Link to={`/clubs/${club._id}`} className="mt-5 block w-full rounded-xl bg-gray-950 py-3 text-center text-sm font-bold text-white">View Details</Link>
    </div>
  </article>;
}
