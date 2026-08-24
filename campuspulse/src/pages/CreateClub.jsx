import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { clubAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const categories = ['Technical', 'Cultural', 'Sports', 'Literary', 'Entrepreneurship', 'Social', 'Photography', 'Music', 'Other'];
const empty = { name: '', description: '', category: 'Technical', image: '' };

export default function CreateClub() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!editing) return;
    clubAPI.getClubById(id).then(r => {
      const c = r.data;
      setForm({
        name: c.name || '',
        description: c.description || '',
        category: c.category || 'Technical',
        image: c.logo || c.coverImage || ''
      });
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [id, editing]);

  if (!currentUser) return null;

  function update(e) {
    setForm(v => ({ ...v, [e.target.name]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim() || !form.description.trim()) {
      setError('Club name and description are required.');
      return;
    }

    setSaving(true);
    try {
      const r = editing
        ? await clubAPI.updateClub(id, form)
        : await clubAPI.createClub(form);

      setMessage(r.message || (editing ? 'Club updated successfully.' : 'Club created successfully.'));
      setTimeout(() => navigate(`/clubs/${r.data?._id || id}`), 350);
    } catch (x) {
      setError(editing ? (x.message || 'Unable to update club. Please try again.') : 'Unable to create club. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageShell><section className="container-page py-12">Loading club...</section></PageShell>;
  }

  return (
    <PageShell>
      <section className="container-page max-w-3xl py-12">
        <Link to="/clubs" className="text-sm font-bold text-gray-500">← Back to clubs</Link>

        <div className="mt-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold text-primary">Campus communities</p>
          <h1 className="mt-2 text-3xl font-black">{editing ? 'Edit club' : 'Create a club'}</h1>
          <p className="mt-2 text-sm text-gray-500">Add the basic information for your campus club.</p>

          {message && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-700">{message}</p>}
          {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}

          <form onSubmit={save} className="mt-6 grid gap-4">
            <Field name="name" label="Club Name" value={form.name} update={update} required />

            <label className="text-sm font-semibold">
              Description
              <textarea
                name="description"
                required
                value={form.description}
                onChange={update}
                rows="5"
                maxLength="3000"
                placeholder="What is this club about?"
                className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-primary"
              />
            </label>

            <label className="text-sm font-semibold">
              Category
              <select name="category" value={form.category} onChange={update} className="mt-1 w-full rounded-xl border bg-white p-3">
                {categories.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>

            <Field
              name="image"
              label="Club Image URL (optional)"
              value={form.image}
              update={update}
              placeholder="https://example.com/club-image.jpg"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? 'Creating...' : editing ? 'Save Changes' : 'Create Club'}
              </button>
              <Link to={editing ? `/clubs/${id}` : '/clubs'} className="rounded-xl border px-5 py-3 text-sm font-bold">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ name, label, type = 'text', value, update, required = false, placeholder = '' }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={update}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-primary"
      />
    </label>
  );
}
