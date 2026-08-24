import mongoose from 'mongoose';
import Club from '../models/Club.js';
import Event from '../models/Event.js';
import { emitRealtime } from '../services/socket/socketService.js';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Literary', 'Entrepreneurship', 'Social', 'Photography', 'Music', 'Other'];

const validId = id => mongoose.isValidObjectId(id);
const safeUrl = value => {
  if (!value) return '';
  try {
    const url = new URL(String(value));
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
    return url.toString();
  } catch {
    const error = new Error('Logo and cover image must be valid http(s) URLs');
    error.status = 400;
    throw error;
  }
};

function payload(body) {
  const { name, description, category, image = '', logo = '', coverImage = '', contactEmail = '' } = body || {};
  if (!name || !description || !category) {
    const error = new Error('Club name, description and category are required');
    error.status = 400;
    throw error;
  }
  if (!CATEGORIES.includes(category)) {
    const error = new Error('Invalid club category');
    error.status = 400;
    throw error;
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    const error = new Error('Invalid contact email');
    error.status = 400;
    throw error;
  }
  return {
    name: String(name).trim(),
    description: String(description).trim(),
    category,
    logo: safeUrl(image || logo),
    coverImage: safeUrl(coverImage),
    contactEmail: String(contactEmail).trim().toLowerCase()
  };
}

function publicClub(club, currentUserId = null) {
  const members = Array.isArray(club.members) ? club.members : [];
  const president = club.president && typeof club.president === 'object'
    ? { _id: club.president._id, name: club.president.name, email: club.president.email, avatar: club.president.avatar }
    : club.president;
  return {
    _id: club._id,
    name: club.name,
    description: club.description,
    category: club.category,
    logo: club.logo,
    coverImage: club.coverImage,
    president,
    contactEmail: club.contactEmail,
    memberCount: members.length,
    status: club.status,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
    isMember: currentUserId ? members.some(id => String(id?._id || id) === String(currentUserId)) : false
  };
}

export async function listClubs(req, res) {
  const q = String(req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const sort = String(req.query.sort || 'newest');
  const filter = { status: 'active' };
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { description: regex }, { category: regex }];
  }
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    members: { memberCount: -1, createdAt: -1 },
    name: { name: 1 }
  };
  const clubs = await Club.find(filter).populate('president', 'name email avatar').sort(sortMap[sort] || sortMap.newest).limit(100).lean();
  return res.json({ success: true, data: clubs.map(c => publicClub(c, req.user?._id)) });
}

export async function getClub(req, res) {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Club not found' });
  const club = await Club.findOne({ _id: req.params.id, status: 'active' })
    .populate('president', 'name email avatar college department')
    .populate('members', 'name email avatar role')
    .lean();
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
  const isManager = Boolean(req.user && (req.user.role === 'admin' || String(club.president?._id || club.president) === String(req.user._id)));
  const events = await Event.find({ club: club._id, status: 'approved' }).populate('organizer', 'name email avatar').sort({ date: 1 }).lean();
  const data = { ...publicClub(club, req.user?._id), events };
  if (isManager) {
    data.members = (club.members || []).map(member => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      avatar: member.avatar,
      role: member.role
    }));
  }
  return res.json({ success: true, data });
}

export async function createClub(req, res) {
  if (!req.user?._id) return res.status(401).json({ success: false, message: 'Authentication required' });
  const data = payload(req.body);
  const existing = await Club.findOne({ name: data.name });
  if (existing) return res.status(409).json({ success: false, message: 'A club with this name already exists' });
  const club = await Club.create({ ...data, president: req.user._id, members: [req.user._id], memberCount: 1 });
  const populated = await Club.findById(club._id).populate('president', 'name email avatar').lean();
  emitRealtime('club:created', { club: publicClub(populated) });
  return res.status(201).json({ success: true, message: 'Club created successfully', data: publicClub(populated, req.user._id) });
}

async function canManage(clubId, user) {
  if (!user) return null;
  const club = await Club.findById(clubId);
  if (!club) return null;
  if (user.role === 'admin' || String(club.president) === String(user._id)) return club;
  return false;
}

export async function updateClub(req, res) {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Club not found' });
  const club = await canManage(req.params.id, req.user);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
  if (club === false) return res.status(403).json({ success: false, message: 'You are not authorized to manage this club' });
  const data = payload(req.body);
  const duplicate = await Club.findOne({ name: data.name, _id: { $ne: club._id } });
  if (duplicate) return res.status(409).json({ success: false, message: 'A club with this name already exists' });
  Object.assign(club, data);
  await club.save();
  const populated = await Club.findById(club._id).populate('president', 'name email avatar').lean();
  emitRealtime('club:updated', { club: publicClub(populated) });
  return res.json({ success: true, message: 'Club updated successfully', data: publicClub(populated, req.user._id) });
}

export async function deleteClub(req, res) {
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Club not found' });
  const club = await canManage(req.params.id, req.user);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
  if (club === false) return res.status(403).json({ success: false, message: 'You are not authorized to delete this club' });
  await Event.updateMany({ club: club._id }, { $set: { club: null } });
  await Club.deleteOne({ _id: club._id });
  emitRealtime('club:deleted', { clubId: String(club._id) });
  return res.json({ success: true, message: 'Club deleted successfully' });
}

export async function joinClub(req, res) {
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can join clubs' });
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Club not found' });
  const club = await Club.findOne({ _id: req.params.id, status: 'active' });
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
  const result = await Club.updateOne(
    { _id: club._id, members: { $ne: req.user._id } },
    { $addToSet: { members: req.user._id }, $inc: { memberCount: 1 } }
  );
  if (!result.modifiedCount) return res.status(409).json({ success: false, message: 'You are already a member of this club' });
  const updated = await Club.findById(club._id).select('memberCount').lean();
  emitRealtime('club:member-count', { clubId: club._id, memberCount: updated.memberCount });
  return res.json({ success: true, message: 'Joined club successfully', data: { memberCount: updated.memberCount, isMember: true } });
}

export async function leaveClub(req, res) {
  if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Only students can leave clubs' });
  if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Club not found' });
  const result = await Club.updateOne(
    { _id: req.params.id, members: req.user._id },
    { $pull: { members: req.user._id }, $inc: { memberCount: -1 } }
  );
  if (!result.modifiedCount) return res.status(404).json({ success: false, message: 'You are not a member of this club' });
  const updated = await Club.findById(req.params.id).select('memberCount').lean();
  emitRealtime('club:member-count', { clubId: req.params.id, memberCount: Math.max(0, updated?.memberCount || 0) });
  return res.json({ success: true, message: 'Left club successfully', data: { memberCount: Math.max(0, updated?.memberCount || 0), isMember: false } });
}

export async function myClubs(req, res) {
  const clubs = await Club.find({ members: req.user._id, status: 'active' }).populate('president', 'name email avatar').sort({ name: 1 }).lean();
  return res.json({ success: true, data: clubs.map(c => publicClub(c, req.user._id)) });
}

export async function removeMember(req, res) {
  if (!validId(req.params.id) || !validId(req.params.userId)) return res.status(404).json({ success: false, message: 'Club or member not found' });
  const club = await canManage(req.params.id, req.user);
  if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
  if (club === false) return res.status(403).json({ success: false, message: 'You are not authorized to manage this club' });
  if (String(club.president) === String(req.params.userId)) return res.status(400).json({ success: false, message: 'The club president cannot be removed' });
  const result = await Club.updateOne({ _id: club._id, members: req.params.userId }, { $pull: { members: req.params.userId }, $inc: { memberCount: -1 } });
  if (!result.modifiedCount) return res.status(404).json({ success: false, message: 'Member not found in this club' });
  const updated = await Club.findById(club._id).select('memberCount').lean();
  emitRealtime('club:member-count', { clubId: club._id, memberCount: Math.max(0, updated?.memberCount || 0) });
  return res.json({ success: true, message: 'Member removed successfully', data: { memberCount: Math.max(0, updated?.memberCount || 0) } });
}

export { CATEGORIES };
