# CampusPulse Phase 5 Stabilization Notes

## Fixes in v8
- Fixed Organizer Dashboard runtime crash: `useLocation()` and `useNavigate()` are now initialized before they are used.
- Added a Windows development preflight that frees an existing process listening on the configured backend port before `nodemon` starts. This addresses the repeated `EADDRINUSE`/"Port 5000 is already in use" loop when an old CampusPulse process remains running.
- Kept backend port at 5000 and frontend API URL at http://localhost:5000/api.
- Kept existing JWT, MongoDB, role-based access, event APIs, and OAuth architecture.
- Admin create/update script remains idempotent for the configured admin account.

## Start
Backend:
```
cd server
npm install
npm run admin:create
npm run dev
```
Frontend:
```
npm install
npm run dev
```

Real Google/GitHub/Facebook OAuth credentials still must be supplied in `server/.env`; they cannot be fabricated.
