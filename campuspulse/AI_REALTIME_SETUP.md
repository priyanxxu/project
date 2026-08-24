# CampusPulse 2.0 — AI + Real-Time Setup

## Run
Backend:
```powershell
cd server
npm install
npm run dev
```

Frontend:
```powershell
npm install
npm run dev
```

## Optional AI
Add to `server/.env`:
```env
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5-mini
```
The key stays server-side. If it is missing/unavailable, CampusPulse uses grounded database-based fallback responses and continues working.

## New APIs
- `POST /api/ai/assistant`
- `POST /api/ai/recommendations`
- `GET /api/ai/insights`
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

## Socket.IO events
- `event:created`
- `event:published`
- `registration:updated`
- `registration:success`
- `notification:new`
- `realtime:connected`

REST APIs remain the primary API path; Socket.IO is additive.
