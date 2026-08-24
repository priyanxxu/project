# CampusPulse Phase 4 Integration Report

## Architecture
React + Vite + Tailwind + React Router -> `src/services/api.js` -> Express REST API -> Mongoose -> MongoDB.

## Local development configuration
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API base: `http://localhost:5000/api`
- Local MongoDB: `mongodb://localhost:27017/CampusPulse`
- CORS origin: `http://localhost:5173`

## Connected flows
- Local student/organizer registration and login
- `/api/auth/me` session restoration
- Organizer create/list/update/delete own events
- New organizer events are `pending`
- Admin pending-event list and approve/reject
- Approved events are returned by `/api/events`
- Event details load from MongoDB
- Student event registration with duplicate/full/event-status checks
- Student registrations
- Calendar uses approved API events and links to real event details
- Navbar reflects authenticated user role and logout state

## Important fixes
- Frontend API service uses `VITE_API_URL` and normalizes a trailing slash.
- No hardcoded API fallback is used when the Vite variable is missing.
- Backend startup logs the configured port and MongoDB connection failure clearly.
- Organizer edits always return events to `pending` for re-approval.
- Admin approve/reject actions only operate on pending events.
- Existing UI components were preserved; changes are data-source/auth/loading integrations.
- Home page featured events now come from the real approved-events API instead of mock event data.

## Required local setup
1. Make sure MongoDB is running locally on port `27017`.
2. From `server/`, run `npm install` then `npm run dev`.
3. From the project root, run `npm install` then `npm run dev`.
4. Test `http://localhost:5000/api/health` before testing the frontend.
5. Create an admin with `npm run admin:create` from `server/` if one does not exist.

## Verification note
Server JavaScript syntax was checked successfully. A full Vite build could not be executed in the packaging environment because the package registry available to the environment returned a 404 while downloading a dependency. This does not change the source changes; run `npm install` and `npm run build` locally to perform the full frontend build check.

OAuth remains credential-dependent and was intentionally not made a fake/local bypass. Socket.IO was not added because REST integration is the required Phase 4 foundation.
