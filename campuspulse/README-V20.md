# CampusPulse fixed-v20

Single-folder CampusPulse project with frontend and backend.

## Start

Terminal 1:
```powershell
npm install
npm run dev
```

Terminal 2:
```powershell
cd server
npm install
npm run dev
```

Frontend API URL is already configured in root `.env`:
`VITE_API_URL=http://localhost:5000/api`

Backend local development configuration is in `server/.env`.
Do not commit real OAuth/Gemini/MongoDB credentials.

## If port 5000 is already in use

Find it:
```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen
```
Then stop the specific process if it is an old CampusPulse process:
```powershell
Stop-Process -Id <PID> -Force
```

The backend no longer runs a script that kills arbitrary processes on port 5000.

## MongoDB
The default local URI is:
`mongodb://127.0.0.1:27017/CampusPulse`

Make sure MongoDB is running.

## Gemini
Add your real key to `server/.env`:
`GEMINI_API_KEY=...`
