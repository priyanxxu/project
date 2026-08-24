import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Mail, Pencil, Shield, Trash2, UserMinus, Users } from 'lucide-react';
import PageShell from '../components/PageShell';
import { clubAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    clubAPI.getClubById(id).then(r => setClub(r.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    const updateCount = ({ clubId, memberCount }) => {
      if (String(clubId) === String(id)) setClub(c => c ? { ...c, memberCount } : c);
    };
    socket.on('club:member-count', updateCount);
    socket.on('club:updated', ({ club: updated }) => { if (String(updated?._id) === String(id)) load(); });
    return () => { socket.off('club:member-count', updateCount); socket.off('club:updated'); };
  }, [id]);

  async function membership(action) {
    setBusy(true); setError(''); setMessage('');
    try {
      const r = action === 'join' ? await clubAPI.join(id) : await clubAPI.leave(id);
      setClub(c => ({ ...c, isMember: action === 'join', memberCount: r.data.memberCount }));
      setMessage(r.message);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function removeMember(userId) {
    if (!window.confirm('Remove this member from the club?')) return;
    try { await clubAPI.removeMember(id, userId); setMessage('Member removed successfully.'); load(); } catch (e) { setError(e.message); }
  }

  async function removeClub() {
    if (!window.confirm('Delete this club? Associated events will be unlinked.')) return;
    setBusy(true);
    try { await clubAPI.deleteClub(id); navigate('/clubs'); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (loading) return <PageShell><section className="container-page py-12">Loading club...</section></PageShell>;
  if (error && !club) return <PageShell><section className="container-page py-12"><p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p></section></PageShell>;
  if (!club) return null;

  const canManage = currentUser?.role === 'admin' || String(club.president?._id || club.president) === String(currentUser?._id);
  const isStudent = currentUser?.role === 'student';

  return <PageShell><section className="container-page py-12">
    <Link to="/clubs" className="text-sm font-bold text-gray-500"><ArrowLeft size={16} className="mr-2 inline"/>Back to clubs</Link>
    <div className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="h-56 bg-gradient-to-br from-violet-100 to-indigo-100">
        {(club.coverImage || club.logo) ? <img src={club.coverImage || club.logo} alt={`${club.name} cover`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-7xl">🏫</div>}
      </div>
      <div className="p-6 sm:p-10">
        <div className="-mt-20 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-violet-50 text-4xl shadow">
              {club.logo ? <img src={club.logo} alt={`${club.name} logo`} className="h-full w-full object-cover"/> : '✦'}
            </div>
            <div className="pb-1"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-primary">{club.category}</span><h1 className="mt-2 text-3xl font-black sm:text-4xl">{club.name}</h1></div>
          </div>
          {canManage && <div className="flex gap-2"><Link to={`/clubs/${id}/edit`} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"><Pencil size={16}/>Edit</Link><button onClick={removeClub} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold text-red-600"><Trash2 size={16}/>Delete</button></div>}
        </div>

        {message && <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</p>}
        {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <h2 className="text-xl font-black">About this club</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{club.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat icon={Users} label="Members" value={club.memberCount || 0}/>
              <Stat icon={Shield} label="President" value={club.president?.name || 'Campus leader'}/>
              <Stat icon={Mail} label="Contact" value={club.contactEmail || 'Not provided'}/>
            </div>
          </div>
          <aside className="rounded-2xl bg-gray-50 p-6">
            <p className="text-sm font-bold text-gray-500">Membership</p>
            {isStudent ? <button disabled={busy} onClick={() => membership(club.isMember ? 'leave' : 'join')} className={`mt-4 w-full rounded-xl py-3 text-sm font-bold text-white ${club.isMember ? 'bg-gray-900' : 'bg-primary'}`}>{busy ? 'Updating...' : club.isMember ? 'Leave Club' : 'Join Club'}</button>
              : !currentUser ? <Link to="/login" className="mt-4 block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white">Login to Join</Link>
              : <p className="mt-3 text-sm text-gray-500">Only student accounts can join or leave clubs.</p>}
          </aside>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black">Club events</h2><span className="text-sm text-gray-500">{club.events?.length || 0} approved</span></div>
          {!club.events?.length ? <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No approved events are associated with this club yet.</p> :
            <div className="mt-4 grid gap-3 md:grid-cols-2">{club.events.map(e => <Link key={e._id} to={`/events/${e._id}`} className="rounded-2xl border p-4 transition hover:border-primary"><p className="font-black">{e.title}</p><p className="mt-1 text-xs text-gray-500"><CalendarDays size={13} className="mr-1 inline"/> {new Date(e.date).toLocaleDateString()} · {e.location}</p><p className="mt-2 text-xs text-primary">{e.category}</p></Link>)}</div>}
        </section>

        {canManage && <MembersPanel club={club} onRemove={removeMember}/>}
      </div>
    </div>
  </section></PageShell>;
}

function MembersPanel({ club, onRemove }) {
  const members = Array.isArray(club.members) ? club.members : [];
  return <section className="mt-10 rounded-2xl border bg-gray-50 p-6">
    <div className="flex items-center gap-2"><UserMinus size={18}/><h2 className="font-black">Member management</h2></div>
    {!members.length ? <p className="mt-3 text-sm text-gray-500">Member details are unavailable.</p> :
      <div className="mt-4 grid gap-2">{members.map(member => <div key={member._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
        <div><p className="text-sm font-bold">{member.name}</p><p className="text-xs text-gray-500">{member.email} · {member.role}</p></div>
        {String(member._id) !== String(club.president?._id || club.president) && <button onClick={() => onRemove(member._id)} className="rounded-lg border px-3 py-2 text-xs font-bold text-red-600">Remove</button>}
      </div>)}</div>}
  </section>;
}

function Stat({ icon: I, label, value }) { return <div className="rounded-xl bg-gray-50 p-4"><I size={17} className="text-primary"/><p className="mt-2 text-xs text-gray-500">{label}</p><p className="mt-1 break-words text-sm font-bold">{value}</p></div>; }
