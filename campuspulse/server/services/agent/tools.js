import mongoose from 'mongoose';
import Event from '../../models/Event.js';
import Club from '../../models/Club.js';
import Registration from '../../models/Registration.js';
import Notification from '../../models/Notification.js';
import { registerUserForEvent } from '../registrationService.js';

const safeEvent = (event, registrationCount = 0) => ({
  id: String(event._id),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  time: event.time,
  location: event.location,
  capacity: event.capacity,
  registrationCount,
  seatsAvailable: Math.max(0, event.capacity - registrationCount)
});

async function counts(ids) {
  const rows = await Registration.aggregate([
    { $match: { event: { $in: ids }, status: 'registered' } },
    { $group: { _id: '$event', count: { $sum: 1 } } }
  ]);
  return new Map(rows.map(x => [String(x._id), x.count]));
}

export async function searchEvents({ query = '', limit = 8 }) {
  const events = await Event.find({ status: 'approved', date: { $gte: new Date() } })
    .sort({ date: 1 }).limit(80).lean();
  const tokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2);
  const ranked = events.map(event => {
    const haystack = `${event.title} ${event.description} ${event.category} ${event.location}`.toLowerCase();
    const score = tokens.reduce((n, token) => n + (haystack.includes(token) ? 1 : 0), 0);
    return { event, score };
  }).sort((a, b) => b.score - a.score || new Date(a.event.date) - new Date(b.event.date));
  const selected = tokens.length ? ranked.filter(x => x.score > 0).slice(0, limit).map(x => x.event) : ranked.slice(0, limit).map(x => x.event);
  const map = await counts(selected.map(e => e._id));
  return selected.map(e => safeEvent(e, map.get(String(e._id)) || 0));
}

export async function getEventDetails({ eventId }) {
  if (!mongoose.isValidObjectId(eventId)) return null;
  const event = await Event.findOne({ _id: eventId, status: 'approved' }).lean();
  if (!event) return null;
  const map = await counts([event._id]);
  return safeEvent(event, map.get(String(event._id)) || 0);
}

export async function getUpcomingEvents({ days = 14, limit = 10 }) {
  const end = new Date(); end.setDate(end.getDate() + Math.min(Math.max(Number(days) || 14, 1), 90));
  const events = await Event.find({ status: 'approved', date: { $gte: new Date(), $lte: end } }).sort({ date: 1 }).limit(limit).lean();
  const map = await counts(events.map(e => e._id));
  return events.map(e => safeEvent(e, map.get(String(e._id)) || 0));
}

export async function getUserRegistrations({ user }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  const rows = await Registration.find({ user: user._id, status: 'registered' })
    .populate({ path: 'event', match: { status: 'approved' } }).sort({ registeredAt: -1 }).lean();
  return rows.filter(r => r.event).map(r => ({ registrationId: String(r._id), registeredAt: r.registeredAt, event: r.event && safeEvent(r.event, 0) }));
}

export async function getOrganizerEvents({ user }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  if (!['organizer', 'admin'].includes(user.role)) return { error: 'FORBIDDEN' };
  const filter = user.role === 'admin' ? {} : { organizer: user._id };
  const events = await Event.find(filter).sort({ date: 1 }).lean();
  const map = await counts(events.map(e => e._id));
  return events.map(e => ({ ...safeEvent(e, map.get(String(e._id)) || 0), status: e.status, organizer: String(e.organizer) }));
}

export async function getEventAnalytics({ user, eventId }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  if (!mongoose.isValidObjectId(eventId)) return null;
  const event = await Event.findById(eventId).lean();
  if (!event) return null;
  if (user.role !== 'admin' && String(event.organizer) !== String(user._id)) return { error: 'FORBIDDEN' };
  const registered = await Registration.countDocuments({ event: event._id, status: 'registered' });
  const attended = await Registration.countDocuments({ event: event._id, status: 'attended' });
  return { event: safeEvent(event, registered), registered, attended, capacityUtilization: event.capacity ? Math.round((registered / event.capacity) * 100) : 0 };
}

export async function createEventDraft({ user, title, description, category, date, time, location, capacity }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  if (!['organizer', 'admin'].includes(user.role)) return { error: 'FORBIDDEN' };
  return { draft: { title, description, category, date, time, location, capacity }, persisted: false, message: 'Draft prepared only. Existing event creation/approval flow must be used to publish it.' };
}

export async function registerForEvent({ user, eventId, confirmed }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  if (user.role !== 'student') return { error: 'FORBIDDEN' };
  if (!confirmed) {
    const event = await getEventDetails({ eventId });
    if (!event) return { error: 'NOT_FOUND' };
    return { requiresConfirmation: true, event };
  }
  const result = await registerUserForEvent({ user, eventId });
  return { registered: true, event: result.event, registration: result.registration };
}

export async function createNotification({ user, message }) {
  if (!user || !['organizer', 'admin'].includes(user.role)) return { error: user ? 'FORBIDDEN' : 'AUTH_REQUIRED' };
  const notification = await Notification.create({ user: user._id, type: 'system', message: String(message).slice(0, 500) });
  return { created: true, notificationId: String(notification._id) };
}


function safeClub(club) {
  return {
    id: String(club._id),
    name: club.name,
    description: club.description,
    category: club.category,
    logo: club.logo,
    coverImage: club.coverImage,
    president: club.president && typeof club.president === 'object' ? { id: String(club.president._id), name: club.president.name } : undefined,
    contactEmail: club.contactEmail,
    memberCount: Array.isArray(club.members) ? club.members.length : (club.memberCount || 0),
    createdAt: club.createdAt
  };
}

export async function searchClubs({ query = '', category = '', limit = 8 }) {
  const filter = { status: 'active' };
  if (category) filter.category = category;
  const clubs = await Club.find(filter).populate('president', 'name').sort({ memberCount: -1, createdAt: -1 }).limit(100).lean();
  const tokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(x => x.length > 2);
  const ranked = clubs.map(club => {
    const text = `${club.name} ${club.description} ${club.category}`.toLowerCase();
    const score = tokens.reduce((n, token) => n + (text.includes(token) ? 1 : 0), 0);
    return { club, score };
  }).sort((a, b) => b.score - a.score || (b.club.memberCount || 0) - (a.club.memberCount || 0));
  const selected = tokens.length ? ranked.filter(x => x.score > 0).slice(0, Math.min(Number(limit) || 8, 20)) : ranked.slice(0, Math.min(Number(limit) || 8, 20));
  return selected.map(x => safeClub(x.club));
}

export async function getClubDetails({ clubId }) {
  if (!mongoose.isValidObjectId(clubId)) return null;
  const club = await Club.findOne({ _id: clubId, status: 'active' }).populate('president', 'name').lean();
  if (!club) return null;
  const events = await Event.find({ club: club._id, status: 'approved' }).sort({ date: 1 }).limit(10).lean();
  return { ...safeClub(club), events: events.map(e => ({ id: String(e._id), title: e.title, category: e.category, date: e.date, time: e.time, location: e.location })) };
}

export async function getUserClubs({ user }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  const clubs = await Club.find({ members: user._id, status: 'active' }).populate('president', 'name').sort({ name: 1 }).lean();
  return clubs.map(safeClub);
}

export async function joinClub({ user, clubId, confirmed }) {
  if (!user) return { error: 'AUTH_REQUIRED' };
  if (user.role !== 'student') return { error: 'FORBIDDEN' };
  if (!mongoose.isValidObjectId(clubId)) return { error: 'NOT_FOUND' };
  const club = await Club.findOne({ _id: clubId, status: 'active' }).lean();
  if (!club) return { error: 'NOT_FOUND' };
  const already = (club.members || []).some(id => String(id) === String(user._id));
  if (already) return { error: 'ALREADY_MEMBER' };
  if (!confirmed) return { requiresConfirmation: true, club: safeClub(club) };
  const updated = await Club.updateOne({ _id: club._id, members: { $ne: user._id } }, { $addToSet: { members: user._id }, $inc: { memberCount: 1 } });
  if (!updated.modifiedCount) return { error: 'ALREADY_MEMBER' };
  const latest = await Club.findById(club._id).select('memberCount').lean();
  return { joined: true, club: safeClub({ ...club, memberCount: latest.memberCount, members: [...(club.members || []), user._id] }) };
}
