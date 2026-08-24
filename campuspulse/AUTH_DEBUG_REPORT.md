# CampusPulse Authentication Debug Report

## Root cause of `Failed to fetch`
The uploaded project had a frontend API client that correctly targeted `VITE_API_URL`, but the backend `.env` contained placeholder values:

- `MONGO_URI=your_mongodb_connection_string`
- `JWT_SECRET=replace_with_a_long_random_secret`

The backend therefore could not start successfully when MongoDB was not configured. A browser fetch to `http://localhost:5000/api/...` then fails at the network layer, which React surfaced as `Failed to fetch`.

The frontend API client has also been hardened to convert network failures into a useful message and preserve HTTP status messages for 400/401/403/404/409/500 responses.

## Authentication architecture
- JWT is stored in an HTTP-only cookie.
- Frontend API requests use `credentials: 'include'`.
- Backend CORS uses the exact `CLIENT_URL` and `credentials: true`.
- Local login/register use `/api/auth/login` and `/api/auth/register`.
- Social login uses browser redirects to Passport OAuth routes; it is not a JSON `fetch` call.

## OAuth status
Real Passport strategies and callback routes are now prepared for Google, GitHub and Facebook. Provider credentials are intentionally not invented. Social login will return HTTP 503 until the corresponding provider credentials are placed in `server/.env`.

Required callback URLs:
- Google: `http://localhost:5000/api/auth/google/callback`
- GitHub: `http://localhost:5000/api/auth/github/callback`
- Facebook: `http://localhost:5000/api/auth/facebook/callback`

## Required local configuration
Copy values from `server/.env.example` into `server/.env`, then fill in the real MongoDB URI, JWT secret, and provider credentials you have created.

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing it.
