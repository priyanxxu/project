import Event from '../models/Event.js';
import User from '../models/User.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import { emitRealtime } from '../services/socket/socketService.js';

export async function pendingEvents(req, res) {
  const events = await Event.find({ status: 'pending' }).populate('organizer', 'name email college department').sort({ createdAt: -1 });
  return res.json({ success: true, data: events });
}

async function setEventStatus(req, res, status) {
  const event = await Event.findOne({ _id: req.params.id, status: 'pending' });
  if (!event) return res.status(404).json({ success: false, message: 'Pending event not found' });
  event.status = status;
  await event.save();
  await event.populate('organizer', 'name email');
  if (status === 'approved') {
    const notification = await Notification.create({
      user: event.organizer._id,
      type: 'event-approved',
      message: `Your event "${event.title}" has been approved.`
    });
    emitRealtime('event:published', { event: event.toObject(), message: 'New event published' });
    emitRealtime('notification:new', notification.toObject(), `user:${event.organizer._id}`);
  }
  return res.json({ success: true, message: `Event ${status} successfully`, data: event });
}

export const approveEvent = (req, res) => setEventStatus(req, res, 'approved');
export const rejectEvent = (req, res) => setEventStatus(req, res, 'rejected');

export async function users(req, res) {
  const data = await User.find().select('-password').sort({ createdAt: -1 });
  return res.json({ success: true, data });
}

export async function organizers(req, res) {
  const data = await User.find({ role: 'organizer' }).select('-password').sort({ createdAt: -1 });
  return res.json({ success: true, data });
}

export async function stats(req, res) {
  const [students, organizersCount, pending, activities, registrations] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'organizer' }),
    Event.countDocuments({ status: 'pending' }),
    Event.countDocuments({ status: 'approved' }),
    Registration.countDocuments({ status: 'registered' })
  ]);
  return res.json({ success: true, data: { students, organizers: organizersCount, pending, activities, registrations } });
}

export async function allRegistrations(req, res) {
  const data = await Registration.find().populate('user', 'name email role').populate('event', 'title date organizer').sort({ registeredAt: -1 });
  return res.json({ success: true, data });
}
