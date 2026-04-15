# Watermelon Music

Watermelon Music is a Supabase-backed music app with a thin Node backend.

Current architecture:
- Frontend + Supabase handle auth and playlist CRUD directly.
- Backend is reserved for chart ingestion/cache plus privileged flows like Spotify OAuth/export and admin-only account deletion.
- Lyrics remain on the backend as a compatibility route for now and are intentionally out of this migration wave.

## Workspaces
- `frontend/`: Vue 3 + Vite client
- `backend/`: Express API for charts and privileged flows
- `database/`: checked-in schema snapshot plus ordered SQL migrations

## Commands
- Frontend build: `cd frontend && npm run build`
- Frontend tests: `cd frontend && npm test`
- Backend checks: `cd backend && npm run check`
- Backend tests: `cd backend && npm test`

## Database
- New DB changes must be added under `database/migrations/`.
- `database/schema.sql` is the checked-in snapshot of the live schema after this backend-slimming wave.
