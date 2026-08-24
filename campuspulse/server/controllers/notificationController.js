import Notification from '../models/Notification.js';
export async function listNotifications(req,res){
  const data=await Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(50).lean();
  return res.json({success:true,data});
}
export async function markRead(req,res){
  const n=await Notification.findOneAndUpdate({_id:req.params.id,user:req.user._id},{read:true},{new:true});
  if(!n) return res.status(404).json({success:false,message:'Notification not found'});
  return res.json({success:true,data:n});
}
export async function markAllRead(req,res){
  await Notification.updateMany({user:req.user._id,read:false},{read:true});
  return res.json({success:true});
}
