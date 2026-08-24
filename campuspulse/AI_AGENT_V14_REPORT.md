# CampusPulse AI Agent

This version adds a controlled Gemini agent around the existing CampusPulse architecture.

## Architecture
React AI Assistant -> POST /api/ai/assistant -> optional session auth -> Gemini service -> controlled tool layer -> existing Mongoose models / registration service -> Gemini final response.

## New files
- server/middleware/optionalAuth.js
- server/services/agent/tools.js
- server/services/registrationService.js

## Modified files
- server/services/ai/aiService.js — real Gemini function-calling agent
- server/controllers/aiController.js — agent endpoint and safe errors
- server/routes/aiRoutes.js — optional authentication for public + private agent tools
- server/controllers/registrationController.js — reuses registration service
- server/package.json — Gemini SDK
- server/.env.example — Gemini variables
- src/components/AIAssistant.jsx — pending confirmation UI and agent context
- src/services/api.js — optional confirmation action payload

## Security
- Gemini key is server-side only.
- Public search tools expose approved events only.
- Private tools use req.user and role checks.
- Registration requires explicit confirmation and student role.
- Organizer analytics are restricted to owned events/admin.
- No arbitrary database commands are exposed to Gemini.
- createEventDraft does not persist data; the existing event creation/approval API remains the publishing path.

## Important
The archive intentionally does not contain a real Gemini API key. Add GEMINI_API_KEY to server/.env locally.
