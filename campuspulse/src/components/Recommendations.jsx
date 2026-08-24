import { useEffect, useState } from 'react';
import { aiAPI } from '../services/api';
export default function Recommendations(){
 const [interests,setInterests]=useState('AI, Web Development'); const [items,setItems]=useState([]); const [loading,setLoading]=useState(false);
 async function load(){setLoading(true);try{const r=await aiAPI.recommendations(interests.split(',').map(x=>x.trim()).filter(Boolean));setItems(r.data||[])}catch{}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 return <section className="mt-8 rounded-2xl border bg-white p-6"><p className="text-sm font-bold text-primary">AI Recommendations</p><h2 className="mt-1 text-2xl font-black">Events for your interests</h2><div className="mt-4 flex gap-2"><input value={interests} onChange={e=>setInterests(e.target.value)} className="flex-1 rounded-xl border p-3 text-sm" placeholder="AI, Web Development"/><button onClick={load} disabled={loading} className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-bold text-white">{loading?'...':'Refresh'}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(e=><div key={e._id} className="rounded-xl bg-gray-50 p-4"><b>{e.title}</b><p className="mt-1 text-xs text-gray-500">{e.category} · {new Date(e.date).toLocaleDateString()}</p><p className="mt-2 text-xs">{e.reason}</p></div>)}</div>{!items.length&&!loading&&<p className="mt-4 text-sm text-gray-500">No matching recommendations found.</p>}</section>
}
