import { useState } from 'react';
import { Bot, Send, Copy, RefreshCw, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { aiAPI } from '../services/api';

const suggestions = [
  '🏆 How do I win a hackathon?',
  '💡 Give me a unique project idea',
  '🤖 How can I add AI to my MERN project?',
  '💻 Explain Socket.IO',
  '🎯 How should I prepare for placements?',
  '📅 Show upcoming campus events',
  '🤝 Show me AI clubs',
  '🏫 What clubs can I join?'
];

function md(text) {
  return String(text || '').split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    if (/^#{1,3} /.test(line)) return <h4 key={i} className="mt-3 font-black">{line.replace(/^#{1,3} /, '')}</h4>;
    if (/^[-*] /.test(line)) return <p key={i}>• {line.slice(2)}</p>;
    if (/^\d+\. /.test(line)) return <p key={i} className="ml-3">{line}</p>;
    return <p key={i}>{line}</p>;
  });
}

const affirmative = /^(yes|yeah|yep|sure|confirm|confirmed|do it|register|register me|join|join me|okay|ok)$/i;

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  async function ask(raw = question, options = {}) {
    const text = String(raw).trim();
    if (!text || loading) return;
    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
    const confirmAction = options.confirmAction || null;
    setQuestion('');
    setError('');
    setMessages(v => [...v, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const response = await aiAPI.ask(text, history, confirmAction);
      const data = response.data || {};
      setMessages(v => [...v, { role: 'assistant', content: data.answer || 'I could not generate a response.' }]);
      setPendingAction(data.pendingAction || null);
    } catch (e) {
      setError(e?.message || 'CampusPulse AI is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    if (pendingAction && affirmative.test(question.trim())) {
      const action = pendingAction;
      setPendingAction(null);
      return ask(question, { confirmAction: action });
    }
    return ask();
  }

  const lastAssistant = [...messages].reverse().find(x => x.role === 'assistant')?.content;

  return (
    <section id="campuspulse-ai" className="container-page py-20">
      <div className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-5 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white"><Bot /></div>
          <p className="mt-4 text-xs font-black uppercase tracking-[.25em] text-primary">CampusPulse AI Agent</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Your intelligent campus companion</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-500">Ask about events, technology, careers, hackathons, projects or your own CampusPulse activity.</p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl rounded-3xl border bg-white p-3 shadow-2xl">
          <div className="max-h-[480px] overflow-y-auto p-3">
            {!messages.length && <div className="grid place-items-center py-12 text-center text-gray-400"><Sparkles className="text-primary" /><p className="mt-3 text-sm">Ask me anything. I can search CampusPulse events and, when authorized, help with safe actions.</p></div>}
            {messages.map((m, i) => (
              <div key={i} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-800'}`}>
                  {m.role === 'assistant' ? md(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && <div className="rounded-2xl bg-gray-50 p-3 text-sm text-gray-500">CampusPulse AI is thinking…</div>}
            {pendingAction && ['registerForEvent','joinClub'].includes(pendingAction.type) && !loading && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={17} /> Confirm action</div>
                <p className="mt-2">{pendingAction.type === 'joinClub' ? <>Join <strong>{pendingAction.club?.name}</strong>?</> : <>Register you for <strong>{pendingAction.event?.title}</strong>?</>}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { const action = pendingAction; setPendingAction(null); ask('Yes, confirm this action.', { confirmAction: action }); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Confirm</button>
                  <button onClick={() => setPendingAction(null)} className="rounded-lg border px-4 py-2 text-xs font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={e => { e.preventDefault(); submit(); }} className="mt-2 flex items-end gap-2 rounded-2xl border p-2">
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows="2" className="flex-1 resize-none border-0 bg-transparent p-2 text-sm outline-none" placeholder="Ask CampusPulse AI anything..." />
            <button disabled={loading || !question.trim()} className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white disabled:opacity-40"><Send size={18} /></button>
          </form>

          {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map(s => <button key={s} onClick={() => ask(s)} disabled={loading} className="rounded-xl border px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary disabled:opacity-50">{s}</button>)}
          </div>

          {messages.length > 0 && <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button onClick={() => navigator.clipboard?.writeText(lastAssistant || '')} className="inline-flex gap-1 rounded-lg border px-3 py-2 text-xs"><Copy size={13} />Copy</button>
            <button onClick={() => { const u = [...messages].reverse().find(x => x.role === 'user'); if (u) ask(u.content); }} className="inline-flex gap-1 rounded-lg border px-3 py-2 text-xs"><RefreshCw size={13} />Regenerate</button>
            <button onClick={() => { setMessages([]); setPendingAction(null); setError(''); }} className="inline-flex gap-1 rounded-lg border px-3 py-2 text-xs"><Trash2 size={13} />Clear</button>
          </div>}
        </div>
      </div>
    </section>
  );
}
