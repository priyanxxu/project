# CampusPulse v18 — Simple Real Create Club

## Existing architecture inspected
1. Clubs UI: `src/pages/Clubs.jsx`
2. Backend entry: `server/server.js`
3. MongoDB: `server/config/db.js`, using `MONGO_URI`
4. Club model already exists: `server/models/Club.js`
5. Club routes already exist: `server/routes/clubRoutes.js`
6. Club controller already exists: `server/controllers/clubController.js`
7. Frontend API client: `src/services/api.js`, using `VITE_API_URL`

## Exact problem found
The Club system already existed in v17, but creation was unnecessarily restricted to `organizer` and `admin` roles in both the frontend and backend. The create form also exposed more fields than required for the simple feature.

## Minimal changes
- `server/routes/clubRoutes.js`
  - `POST /api/clubs` now uses existing authentication only.
  - Club edit/delete/member-management routes now rely on the controller's existing owner/admin authorization instead of a role-only middleware, so a student who created a club can manage their own club.
  - Student join/leave routes remain role-protected.
- `server/controllers/clubController.js`
  - Creation accepts the requested `image` field and maps it to the existing `logo` storage field.
  - Creation remains MongoDB-backed and uses the authenticated user as president/creator.
  - Existing validation and duplicate-name protection remain.
- `src/pages/Clubs.jsx`
  - Existing `+ Create Club` button is available to any authenticated user.
  - Existing dynamic GET `/api/clubs` list remains unchanged.
  - Club image falls back to the logo when no cover image exists.
- `src/pages/CreateClub.jsx`
  - Simplified to: Club Name, Description, Category, Club Image URL (optional), Create/Cancel.
  - Client-side required-field validation.
  - Creation failure shows `Unable to create club. Please try again.`
- `src/App.jsx`
  - Create/edit club pages now require authentication rather than an organizer/admin-only frontend route.
- `src/pages/ClubDetails.jsx`
  - Uses the club image/logo as the cover fallback.

## No unnecessary changes
- Authentication providers were not changed.
- Event functionality was not changed.
- MongoDB connection was not changed.
- No new server was created.
- No hardcoded club list was added.
- Existing Club model/API were reused.
