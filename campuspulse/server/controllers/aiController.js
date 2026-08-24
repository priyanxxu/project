import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { answerAgent, recommendEvents, organizerInsight, aiConfiguration } from '../services/ai/aiService.js';

const rateWindow = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function allowAIRequest(req) {
  const key = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const recent = (rateWindow.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) { rateWindow.set(key, recent); return false; }
  recent.push(now); rateWindow.set(key, recent); return true;
}

async function approvedEvents(question = '') {
  const base = { status: 'approved', date: { $gte: new Date('2000-01-01') } };
  const events = await Event.find(base).sort({ date: 1 }).limit(100).lean();

  const counts = await Registration.aggregate([
    { $match: { event: { $in: events.map((e) => e._id) }, status: 'registered' } },
    { $group: { _id: '$event', count: { $sum: 1 } } }
  ]);
  const map = new Map(counts.map((x) => [String(x._id), x.count]));
  const enriched = events.map((e) => ({ ...e, registrationCount: map.get(String(e._id)) || 0 }));

  const tokens = String(question).toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 2);
  if (!tokens.length) return enriched.slice(0, 20);

  const scored = enriched
    .map((e) => {
      const text = `${e.title || ''} ${e.description || ''} ${e.category || ''} ${e.location || ''}`.toLowerCase();
      const score = tokens.reduce((n, token) => n + (text.includes(token) ? 1 : 0), 0);
      return { e, score };
    })
    .sort((a, b) => b.score - a.score || new Date(a.e.date) - new Date(b.e.date));

  const matched = scored.filter((x) => x.score > 0).slice(0, 20).map((x) => x.e);
  const broad = /\b(upcoming|available|this week|today|tomorrow|events|hackathon|campus)\b/i.test(question);
  return matched.length ? matched : (broad ? enriched.slice(0, 20) : []);
}

export async function askAI(req, res) {
  const question = String(req.body?.question || '').trim();
  if (!question) return res.status(400).json({ success: false, message: 'Question is required' });
  if (!allowAIRequest(req)) return res.status(429).json({ success: false, message: 'Too many AI requests. Please wait a moment and try again.' });
  if (question.length > 4000) return res.status(400).json({ success: false, message: 'Question is too long' });
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
  const confirmAction = req.body?.confirmAction && typeof req.body.confirmAction === 'object' ? req.body.confirmAction : null;
  try {
    const result = await answerAgent({ question, history, user: req.user || null, confirmAction });
    return res.json({ success: true, data: { answer: result.answer, provider: result.provider, model: result.model, pendingAction: result.pendingAction || null, action: result.action || null } });
  } catch (error) {
    if (error.code === 'GEMINI_NOT_CONFIGURED') return res.status(503).json({ success: false, message: 'CampusPulse AI is temporarily unavailable. Please configure GEMINI_API_KEY on the server.' });
    const status = error?.status || error?.response?.status;
    console.error('[AI Agent] Request failed:', error?.message || error);
    if (status === 400) return res.status(502).json({ success: false, message: 'Gemini rejected the AI request. Check GEMINI_MODEL and API access.' });
    if (status === 401 || status === 403) return res.status(502).json({ success: false, message: 'Gemini API authentication or permission failed. Check GEMINI_API_KEY.' });
    if (status === 429) return res.status(429).json({ success: false, message: 'Gemini quota or rate limit reached. Please try again later.' });
    if (status === 408 || error?.name?.includes('Timeout') || error?.name === 'AbortError') return res.status(503).json({ success: false, message: 'CampusPulse AI timed out. Please try again.' });
    return res.status(503).json({ success: false, message: 'CampusPulse AI is temporarily unavailable. Please try again.' });
  }
}

export async function recommendations(req, res) {
  try {
    const interests = Array.isArray(req.body?.interests) ? req.body.interests.slice(0, 20) : [];
    const events = await approvedEvents('upcoming events');
    const data = await recommendEvents({ interests, events });
    return res.json({ success: true, data });
  } catch {
    return res.status(503).json({ success: false, message: 'CampusPulse AI is temporarily unavailable. Please try again.' });
  }
}

export async function insights(req, res) {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ date: 1 }).lean();
    const counts = await Registration.aggregate([
      { $match: { event: { $in: events.map((e) => e._id) }, status: 'registered' } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]);
    const map = new Map(counts.map((x) => [String(x._id), x.count]));
    const rows = events.map((e) => ({ ...e, registrationCount: map.get(String(e._id)) || 0 }));
    const text = await organizerInsight({
      events: rows.map((e) => ({ title: e.title, registrationCount: e.registrationCount, status: e.status }))
    });
    return res.json({ success: true, data: { insight: text, events: rows } });
  } catch {
    return res.status(503).json({ success: false, message: 'CampusPulse AI is temporarily unavailable. Please try again.' });
  }
}

export async function aiHealth(req, res) { return res.json({ success: true, ...aiConfiguration() }); }
