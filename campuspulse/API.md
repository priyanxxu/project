# CampusPulse API

Base URL: `http://localhost:5000/api`

Authentication uses an **HTTP-only JWT cookie**. The frontend sends requests with credentials enabled. A Bearer JWT is also accepted by protected endpoints for future clients.

## Authentication

### POST `/auth/register`
- Auth: Public
- Body: `{ name, email, password, college, department, year, role }`
- Public roles: `student`, `organizer`
- Response: `{ success, message, data: { user } }`

### POST `/auth/login`
- Auth: Public
- Body: `{ email, password, portalRole? }`
- `portalRole` may be `student`, `organizer`, or `admin` for portal-entry validation.

### GET `/auth/me`
- Auth: Required
- Returns the current user without a password.

### POST `/auth/logout`
- Auth: Public
- Clears the HTTP-only cookie.

### GET `/auth/google`, `/auth/github`, `/auth/facebook`
- Placeholder only. Returns `501` until real OAuth credentials/providers are configured.

## Events

### GET `/events`
- Auth: Public
- Returns approved events only.

### GET `/events/:id`
- Auth: Public
- Returns one approved event and registration count.

### POST `/events`
- Auth: Organizer
- Body: `{ title, description, category, date, time, location, capacity, image? }`
- New events start as `pending`.

### GET `/events/organizer/my-events`
- Auth: Organizer
- Returns the logged-in organizer's events.

### PUT `/events/:id`
- Auth: Event owner (Organizer)
- Updates an owned event. Updating an approved event sends it back to `pending` for review.

### DELETE `/events/:id`
- Auth: Event owner (Organizer)
- Deletes the event and its registrations.

## Registrations

### POST `/events/:id/register`
- Auth: Student
- Registers once if the event is approved and not full.

### DELETE `/events/:id/register`
- Auth: Student
- Cancels the student's active registration.

### GET `/events/:id/registrations`
- Auth: Event owner (Organizer) or Admin
- Lists registered users for an event.

### GET `/user/registrations`
- Auth: Student
- Returns the logged-in student's active registrations.

## Admin

### GET `/admin/events/pending`
- Auth: Admin
- Lists pending events.

### PUT `/admin/events/:id/approve`
- Auth: Admin
- Sets status to `approved`.

### PUT `/admin/events/:id/reject`
- Auth: Admin
- Sets status to `rejected`.

### GET `/admin/users`
- Auth: Admin
- Lists users without passwords.

### GET `/admin/organizers`
- Auth: Admin
- Lists organizers.

### GET `/admin/stats`
- Auth: Admin
- Returns student, organizer, pending, approved activity and registration counts.

### GET `/admin/registrations`
- Auth: Admin
- Lists all registrations.

## Health

### GET `/health`
Returns `{ "success": true, "message": "CampusPulse API is running" }`.
