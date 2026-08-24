
# CampusPulse

# CampusPulse — MERN Backend Integration

This version keeps the existing React + Tailwind UI and adds a real Express + MongoDB + Mongoose backend. The existing root folder remains the Vite frontend because the original project already used that structure; a separate `server/` folder is added instead of creating a duplicate `client/` application.

## Existing UI preserved

The landing page, Tailwind styles, reusable cards, navigation and existing page structure are preserved. Only the minimum wiring/form additions required for real API integration were made.

## Run

### 1. MongoDB
Create a MongoDB database using MongoDB Atlas or a local MongoDB server. Put its connection string in `server/.env` as `MONGO_URI`.

### 2. Backend

```powershell
cd server
npm install
npm run dev
```

Backend health check: `http://localhost:5000/api/health`

The API now stays online if MongoDB is temporarily unavailable and retries the connection every 10 seconds. During that time, `/api/health` returns HTTP 503 with `database: "disconnected"` instead of the Node process crashing. Once MongoDB is available, the same endpoint returns HTTP 200.

If startup reports that port 5000 is already in use, stop the older backend process or set another `PORT` in `server/.env`, then update `VITE_API_URL` to match.

### 3. Frontend
Open a second terminal from the project root:

```powershell
npm install
npm run dev
```

Vite will normally run at `http://localhost:5173`.

## Admin account

Admin registration is intentionally not public. Create the first admin through the server script:

```powershell
cd server
npm run admin:create -- "CampusPulse Admin" admin@campuspulse.local "ChangeMe123!"
```

Use a strong real password and change the example credentials before sharing the project.

## Environment variables

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Backend `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
JWT_EXPIRES_IN=7d
COOKIE_NAME=campuspulse_token
```

`.env` files are ignored by Git. Commit only `.env.example` files.

## Authentication design

CampusPulse uses bcryptjs for password hashing and JWT authentication. The JWT is stored in an HTTP-only cookie rather than localStorage. The React `AuthContext` calls `GET /api/auth/me` when the app starts so a refresh restores the logged-in user.

The backend, not the frontend, decides whether a user is a student, organizer or admin. Portal login sends `portalRole`, and the backend returns `403` when the account does not have that role.

Google/GitHub/Facebook buttons are intentionally not fake. They show a clear placeholder message until real OAuth credentials and provider callbacks are configured.

## Event lifecycle

Organizer registers → organizer logs in → creates event → MongoDB saves `pending` → admin sees it → admin approves → status becomes `approved` → public Events page fetches it → Calendar fetches the same approved event → student registers → registration count is stored in MongoDB.

## REST API

See `API.md` for the complete endpoint documentation.

## Future phase

`TODO: Phase 4.5: Add Socket.IO real-time events.`

Possible real-time features: new event notifications, live registration counts, live calendar updates and admin approval notifications. Socket.IO is deliberately not included until the REST flow is stable.
>>>>>>> 4c81837 (Initial CampusPulse commit)
