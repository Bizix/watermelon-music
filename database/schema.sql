CREATE TABLE artists (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE songs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    artist_id INT REFERENCES artists(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE SET NULL,
    youtube_url TEXT,
    genius_url TEXT,
    spotify_url TEXT,
    apple_music_url TEXT,
    rank INT,
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE playlists (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE playlist_songs (
    playlist_id INT REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INT REFERENCES songs(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, song_id)
);
