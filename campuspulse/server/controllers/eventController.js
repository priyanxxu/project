import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { emitRealtime } from '../services/socket/socketService.js';
import Club from '../models/Club.js';

const validateId = id => mongoose.isValidObjectId(id);

function eventPayload(body) {
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    date: body.date,
    time: body.time,
    location: body.location,
    capacity: body.capacity,
    image: body.image || '',
    club: body.clubId || body.club || null
  };
}

async function withCounts(events) {
  const ids = events.map(e => e._id);
  const counts = await Registration.aggregate([
    { $match: { event: { $in: ids }, status: 'registered' } },
    { $group: { _id: '$event', count: { $sum: 1 } } }
  ]);
  const map = new Map(counts.map(x => [x._id.toString(), x.count]));
  return events.map(e => ({ ...e.toObject(), registrationCount: map.get(e._id.toString()) || 0 }));
}

export async function listEvents(req, res) {
  const events = await Event.find({ status: 'approved', date: { $gte: new Date('2000-01-01') } }).populate('organizer', 'name email avatar').populate('club', 'name logo category').sort({ date: 1 });
  return res.json({ success: true, data: await withCounts(events) });
}

export async function getEvent(req, res) {
  if (!validateId(req.params.id)) return res.status(404).json({ success: false, message: 'Event not found' });
  const event = await Event.findOne({ _id: req.params.id, status: 'approved' }).populate('organizer', 'name email avatar college department').populate('club', 'name logo category');
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  const registrationCount = await Registration.countDocuments({ event: event._id, status: 'registered' });
  return res.json({ success: true, data: { ...event.toObject(), registrationCount } });
}

async function validateClubForEvent(clubId, user) {
  if (!clubId) return null;
  if (!mongoose.isValidObjectId(clubId)) {
    const error = new Error('Invalid club');
    error.status = 400;
    throw error;
  }
  const club = await Club.findOne({ _id: clubId, status: 'active' });
  if (!club) {
    const error = new Error('Club not found');
    error.status = 404;
    throw error;
  }
  if (user.role !== 'admin' && String(club.president) !== String(user._id)) {
    const error = new Error('You can only associate events with clubs you manage');
    error.status = 403;
    throw error;
  }
  return club._id;
}

export async function createEvent(req, res) {
  const { title, description, category, date, time, location, capacity } = req.body;
  if (!title || !description || !category || !date || !time || !location || capacity === undefined) return res.status(400).json({ success: false, message: 'All event fields are required' });
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid event date' });
  if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) return res.status(400).json({ success: false, message: 'Capacity must be a positive whole number' });

  const club = await validateClubForEvent(req.body.clubId || req.body.club, req.user);
  const event = await Event.create({ ...eventPayload(req.body), club, date: parsedDate, capacity: Number(capacity), organizer: req.user._id, status: 'pending' });
  emitRealtime('event:created', { event: event.toObject(), message: 'New event created' }, 'organizers');
  return res.status(201).json({ success: true, message: 'Event created successfully and sent for approval', data: event });
}

export async function myEvents(req, res) {
  const events = await Event.find({ organizer: req.user._id }).populate('club', 'name logo category').sort({ createdAt: -1 });
  return res.json({ success: true, data: await withCounts(events) });
}

export async function updateEvent(req, res) {
  if (!validateId(req.params.id)) return res.status(404).json({ success: false, message: 'Event not found' });
  const event = await Event.findOne({ _id: req.params.id, organizer: req.user._id });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found or you are not its organizer' });
  event.status = 'pending';
  const club = await validateClubForEvent(req.body.clubId || req.body.club || null, req.user);
  Object.assign(event, eventPayload(req.body));
  event.club = club;
  if (req.body.date) {
    const parsedDate = new Date(req.body.date);
    if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ success: false, message: 'Invalid event date' });
    event.date = parsedDate;
  }
  if (req.body.capacity !== undefined) event.capacity = Number(req.body.capacity);
  await event.save();
  return res.json({ success: true, message: 'Event updated successfully and returned to pending approval', data: event });
}

export async function deleteEvent(req, res) {
  if (!validateId(req.params.id)) return res.status(404).json({ success: false, message: 'Event not found' });
  const event = await Event.findOneAndDelete({ _id: req.params.id, organizer: req.user._id });
  if (!event) return res.status(404).json({ success: false, message: 'Event not found or you are not its organizer' });
  await Registration.deleteMany({ event: event._id });
  return res.json({ success: true, message: 'Event deleted successfully' });
}
