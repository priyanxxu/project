import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import { emitRealtime } from '../services/socket/socketService.js';
import { registerUserForEvent } from '../services/registrationService.js';

export async function registerForEvent(req, res) {
  try {
    const result = await registerUserForEvent({ user: req.user, eventId: req.params.id });
    return res.status(201).json({ success: true, message: 'Registered successfully', data: result.registration });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Registration failed' });
  }
}

export async function cancelRegistration(req, res) {
  const registration = await Registration.findOneAndUpdate({ user: req.user._id, event: req.params.id, status: 'registered' }, { status: 'cancelled' }, { new: true });
  if (!registration) return res.status(404).json({ success: false, message: 'Active registration not found' });
  return res.json({ success: true, message: 'Registration cancelled successfully', data: registration });
}

export async function getEventRegistrations(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'You cannot view registrations for this event' });
  const registrations = await Registration.find({ event: event._id, status: 'registered' }).populate('user', 'name email college department year avatar').sort({ registeredAt: -1 });
  return res.json({ success: true, data: registrations });
}

export async function getUserRegistrations(req, res) {
  const registrations = await Registration.find({ user: req.user._id, status: 'registered' }).populate({ path: 'event', populate: { path: 'organizer', select: 'name email' } }).sort({ registeredAt: -1 });
  return res.json({ success: true, data: registrations });
}
