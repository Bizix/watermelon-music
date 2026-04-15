# API Docs

This backend is intentionally thin. It exists for chart refresh and cache orchestration, Spotify OAuth/export, account deletion, and the legacy lyrics lookup route that remains for compatibility.

## Public API

### `GET /api/rankings?genre=<genreCode>`
- Returns the current rankings array for the requested genre.
- Response shape is unchanged from the pre-migration client contract.
- If cached data is stale or missing, the backend queues a background refresh and still returns the best available DB-backed rankings immediately.
- `genre` defaults to `DM0000`.

### `GET /api/scrape-status?genre=<genreCode>`
- Returns structured refresh metadata for a chart genre.
- `genre` defaults to `DM0000`.
- Response fields:
  - `genreCode`
  - `status`
  - `reason`
  - `error`
  - `startedAt`
  - `finishedAt`
  - `lastSuccessAt`
  - `inProgress`

### `GET /api/scrape?genre=<genreCode>`
- Manually queues a chart refresh.
- Returns `202 Accepted`.
- Intended for operational/manual use rather than normal frontend traffic.
- `genre` defaults to `DM0000`.

### `GET /api/cron?secret=<cronSecret>`
- Rotates through chart genres and queues the next scheduled refresh.
- Returns `202 Accepted` immediately, then performs work in the background.
- Requires `secret` to match `CRON_SECRET`.

### `POST /api/delete-user`
- Deletes the authenticated user account.
- Requires `Authorization: Bearer <supabase-access-token>`.
- Request body:

```json
{
  "userId": "supabase-user-uuid"
}
```

- The body `userId` must match the authenticated Supabase user id.

## Spotify

### `GET /api/spotify/login?from=<path>&user_id=<uuid>`
- Starts Spotify OAuth.
- `from` controls where the user is redirected in the frontend after a successful callback.
- `user_id` is required so the callback can store tokens on the matching user record.

### `GET /api/spotify/callback`
- Spotify OAuth callback endpoint.
- Exchanges the auth code for tokens and stores them in `public.users`.
- Redirects back to `FRONTEND_URL + from`.

### `POST /api/spotify/export-playlist`
- Exports a playlist to Spotify for the authenticated user.
- Requires `Authorization: Bearer <supabase-access-token>`.
- Request body:

```json
{
  "playlistId": 123
}
```

- Returns:

```json
{
  "success": true,
  "spotifyPlaylistId": "spotify-playlist-id",
  "playlistUrl": "https://open.spotify.com/playlist/..."
}
```

## Legacy Compatibility

### `GET /api/lyrics?title=<title>&artist=<artist>&songId=<melonSongId>`
- Looks up lyrics from cache/database first, then falls back to external lookups/scraping when needed.
- This route remains active for compatibility but is not part of the long-term slim backend target.

## Internal Data Ownership
- Playlist CRUD no longer belongs to the backend.
- Frontend playlist reads and writes should go directly through Supabase with RLS-backed access.
