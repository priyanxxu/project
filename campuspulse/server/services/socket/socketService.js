import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import cookie from 'cookie';

let ioInstance=null;
export function initSocket(io){
  ioInstance=io;
  io.use(async(socket,next)=>{
    try{
      const raw=socket.handshake.auth?.token || '';
      let token=raw;
      if(!token && socket.handshake.headers?.cookie){
        const cookies=cookie.parse(socket.handshake.headers.cookie);
        token=cookies[process.env.COOKIE_NAME || 'campuspulse_token'];
      }
      if(token){
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        socket.user=await User.findById(decoded.userId).select('_id role name');
      }
    }catch(error){ socket.user=null; }
    next();
  });
  io.on('connection',socket=>{
    if(socket.user) socket.join(`user:${socket.user._id}`);
    if(socket.user?.role==='organizer') socket.join('organizers');
    if(socket.user?.role==='admin') socket.join('admins');
    socket.emit('realtime:connected',{authenticated:Boolean(socket.user)});
    socket.on('disconnect',()=>{});
  });
  return io;
}
export function emitRealtime(event,payload,room=null){
  if(!ioInstance) return;
  if(room) ioInstance.to(room).emit(event,payload);
  else ioInstance.emit(event,payload);
}
