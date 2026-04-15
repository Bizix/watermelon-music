# Docs

## Backend Boundary
- Keep the backend for chart refresh, Spotify OAuth/export, and delete-user.
- The lyrics route is still present for compatibility, but it is not part of the long-term backend target.
- Do not add new playlist CRUD endpoints; playlist reads and writes now belong in Supabase-backed frontend code.

## Database Workflow
- Add new schema changes as ordered SQL files in `database/migrations/`.
- After schema changes are finalized, update `database/schema.sql` so the repo snapshot stays current.

## Verification Gates
- Backend: `npm run check && npm test`
- Frontend: `npm run build && npm test`
