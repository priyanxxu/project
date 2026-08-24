import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Notification from '../models/Notification.js';
import { emitRealtime } from './socket/socketService.js';

export async function registerUserForEvent({ user, eventId }) {
  const event = await Event.findOne({ _id: eventId, status: 'approved' });
  if (!event) { const e = new Error('Approved event not found'); e.status = 404; throw e; }
  if (event.date < new Date()) { const e = new Error('Registration is closed because the event has already started'); e.status = 400; throw e; }
  const existing = await Registration.findOne({ user: user._id, event: event._id });
  if (existing && existing.status === 'registered') { const e = new Error('You are already registered for this event'); e.status = 409; throw e; }
  const count = await Registration.countDocuments({ event: event._id, status: 'registered' });
  if (count >= event.capacity) { const e = new Error('This event is full'); e.status = 409; throw e; }
  const registration = existing
    ? await Registration.findByIdAndUpdate(existing._id, { status: 'registered', registeredAt: new Date() }, { new: true })
    : await Registration.create({ user: user._id, event: event._id });
  const organizerMessage = `${user.name || 'A student'} registered for "${event.title}".`;
  const notification = await Notification.create({ user: event.organizer, type: 'registration', message: organizerMessage });
  const registrationCount = await Registration.countDocuments({ event: event._id, status: 'registered' });
  emitRealtime('registration:updated', { eventId: event._id, registrationCount }, `user:${event.organizer}`);
  emitRealtime('notification:new', notification.toObject(), `user:${event.organizer}`);
  emitRealtime('registration:success', { eventId: event._id, message: 'Registration successful' }, `user:${user._id}`);
  return { event: { id: String(event._id), title: event.title, date: event.date, time: event.time, location: event.location }, registration };
}
