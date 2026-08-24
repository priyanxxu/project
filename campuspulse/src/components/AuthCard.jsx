import { useEffect, useState } from 'react';
import { Eye, EyeOff, Chrome, Facebook, Github } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';

export default function AuthCard({ register = false }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', department: '', year: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState('');
  const [error, setError] = useState('');
  const { login, register: registerUser } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get('oauthError');
    if (oauthError) setError(oauthError);
  }, [location.search]);

  const update = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const redirectForRole = role => role === 'admin' ? '/admin/dashboard' : role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard';

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = register
        ? await registerUser(form)
        : await login({ email: form.email, password: form.password });
      nav(location.state?.from || redirectForRole(user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  }

  function startOAuth(provider) {
    setError('');
    setOauthLoading(provider);
    window.location.assign(`${API_URL}/auth/${provider}`);
  }

  return <form onSubmit={submit} className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-xl sm:p-8">
    <h1 className="text-3xl font-black">{register ? 'Create your account' : 'Welcome back'}</h1>
    <p className="mt-2 text-sm text-gray-500">{register ? 'Join your campus community.' : "Sign in to discover what's happening on campus."}</p>
    {register && <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">Full name<input name="name" value={form.name} onChange={update} required className="mt-1 w-full rounded-xl border p-3" placeholder="Your name"/></label>
      <label className="text-sm font-semibold">College<input name="college" value={form.college} onChange={update} className="mt-1 w-full rounded-xl border p-3" placeholder="College"/></label>
      <label className="text-sm font-semibold">Department<input name="department" value={form.department} onChange={update} className="mt-1 w-full rounded-xl border p-3" placeholder="ECE, CSE..."/></label>
      <label className="text-sm font-semibold">Year<input name="year" value={form.year} onChange={update} className="mt-1 w-full rounded-xl border p-3" placeholder="2nd Year"/></label>
      <label className="text-sm font-semibold">Account type<select name="role" value={form.role} onChange={update} className="mt-1 w-full rounded-xl border p-3"><option value="student">Student</option><option value="organizer">Organizer</option></select></label>
    </div>}
    <div className="mt-6 grid gap-4">
      <label className="text-sm font-semibold">Email<input name="email" value={form.email} onChange={update} type="email" required className="mt-1 w-full rounded-xl border p-3" placeholder="you@college.edu"/></label>
      <label className="text-sm font-semibold">Password<div className="relative mt-1"><input name="password" value={form.password} onChange={update} minLength={6} type={show?'text':'password'} required className="w-full rounded-xl border p-3 pr-11" placeholder="••••••••"/><button type="button" aria-label="Toggle password" onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-gray-500">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
    </div>
    {!register&&<div className="mt-3 flex items-center justify-between text-xs"><label><input type="checkbox" className="mr-2"/>Remember me</label><button type="button" className="font-bold text-primary">Forgot password?</button></div>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    <button disabled={loading || Boolean(oauthLoading)} className="mt-6 w-full rounded-xl bg-primary py-3 font-bold text-white disabled:opacity-60">{loading ? 'Please wait...' : register?'Create Account':'Sign In'}</button>
    <div className="my-6 flex items-center gap-3 text-xs text-gray-400"><span className="h-px flex-1 bg-gray-100"/>OR CONTINUE WITH<span className="h-px flex-1 bg-gray-100"/></div>
    <div className="grid grid-cols-3 gap-2">{[[Chrome,'Google','google'],[Github,'GitHub','github'],[Facebook,'Facebook','facebook']].map(([I,n,p])=><button type="button" key={n} disabled={loading || Boolean(oauthLoading)} onClick={()=>startOAuth(p)} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold disabled:opacity-60"><I size={15}/><span className="hidden sm:inline">{oauthLoading===p?'Connecting...':n}</span></button>)}</div>
    <p className="mt-6 text-center text-sm text-gray-500">{register?'Already have an account?':"Don't have an account?"} <Link className="font-bold text-primary" to={register?'/login':'/register'}>{register?'Login':'Create an account'}</Link></p>
  </form>;
}
