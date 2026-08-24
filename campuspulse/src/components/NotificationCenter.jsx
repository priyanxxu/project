import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { socket } from '../services/socket';

export default function NotificationCenter(){
  const [items,setItems]=useState([]);
  const [open,setOpen]=useState(false);
  const unread=useMemo(()=>items.filter(x=>!x.read).length,[items]);
  useEffect(()=>{
    notificationAPI.list().then(r=>setItems(r.data||[])).catch(()=>{});
    const onNew=n=>setItems(prev=>[n,...prev.filter(x=>x._id!==n._id)].slice(0,50));
    socket.on('notification:new',onNew);
    return()=>socket.off('notification:new',onNew);
  },[]);
  async function read(id){try{await notificationAPI.markRead(id);setItems(x=>x.map(n=>n._id===id?{...n,read:true}:n))}catch{}}
  async function all(){try{await notificationAPI.markAllRead();setItems(x=>x.map(n=>({...n,read:true})))}catch{}}
  return <div className="relative">
    <button aria-label="Notifications" onClick={()=>setOpen(v=>!v)} className="relative rounded-lg p-2 hover:bg-gray-100"><Bell size={18}/>{unread>0&&<span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">{unread>9?'9+':unread}</span>}</button>
    {open&&<div className="absolute right-0 top-11 z-[60] w-80 rounded-2xl border bg-white p-3 shadow-xl">
      <div className="flex items-center justify-between px-2 py-1"><b>Notifications</b><button onClick={all} className="text-xs font-bold text-primary"><CheckCheck size={15}/></button></div>
      <div className="mt-2 max-h-80 overflow-auto">{!items.length?<p className="p-4 text-sm text-gray-500">No notifications yet.</p>:items.map(n=><button key={n._id} onClick={()=>read(n._id)} className={`w-full rounded-xl p-3 text-left text-sm ${n.read?'bg-white':'bg-primary/5'}`}><p className="font-semibold">{n.message}</p><p className="mt-1 text-[11px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p></button>)}</div>
    </div>}
  </div>
}
