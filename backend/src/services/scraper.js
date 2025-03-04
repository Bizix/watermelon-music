const puppeteer = require('puppeteer');
const pool = require('../config/db');
const cache = new Map();


async function scrapeMelonCharts(genreCode = "DM0000") {
    console.log(`🚀 Scraping Melon chart for genre: ${genreCode}...`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const genreUrl = `https://www.melon.com/chart/day/index.htm?classCd=${genreCode}`;
    await page.goto(genreUrl, { waitUntil: 'networkidle2' });

    console.log(`🟢 Opened Melon chart page for genre: ${genreCode}`);

    const songs = await page.evaluate(() => {
        const rankAr = document.querySelectorAll(".lst50 .rank, .lst100 .rank"); // ✅ Include .lst100
        const titleAr = document.querySelectorAll(".lst50 .rank01>span>a, .lst100 .rank01>span>a");
        const artistContainers = document.querySelectorAll(".lst50 .rank02, .lst100 .rank02"); // ✅ Include .lst100
        const albumAr = document.querySelectorAll(".lst50 .rank03>a, .lst100 .rank03>a");
        const artAr = document.querySelectorAll(".lst50 .image_typeAll img, .lst100 .image_typeAll img");
        const keyAr = document.querySelectorAll(".lst50[data-song-no], .lst100[data-song-no]"); // ✅ Fix song key selection

        return Array.from(rankAr).map((ranking, index) => {
            const rank = parseInt(ranking.textContent.trim(), 10);
            const title = titleAr[index]?.textContent.trim() || "Unknown Title";

            // ✅ Extract artists properly from both lists
            const artistContainer = artistContainers[index];
            let artist = "Unknown Artist";
            if (artistContainer) {
                const artistLinks = artistContainer.querySelectorAll("a");
                if (artistLinks.length > 0) {
                    const artistNames = new Set(Array.from(artistLinks).map(a => a.textContent.trim()));
                    artist = Array.from(artistNames).join(", ");
                } else {
                    artist = artistContainer.textContent.trim();
                }
            }

            const album = albumAr[index]?.textContent.trim() || "Unknown Album";
            const art = artAr[index]?.getAttribute("src")?.trim() || "No Image Found";
            const key = keyAr[index]?.getAttribute("data-song-no") || "000000";

            return { rank, title, artist, album, art, key };
        });
    });



    // // 🛠 Debugging logs
    // console.log(`✅ Successfully scraped ${songs.length} songs for genre: ${genreCode}`);

    // if (songs.length === 0) {
    //     console.warn(`⚠️ Warning: No songs were scraped for genre: ${genreCode}!`);
    // } else {
    //     console.log("🔍 Sample data from scraping:");
    //     console.table(songs.slice(0, 50));  // Print the first 50 songs for verification
    //     console.table(songs.slice(50, 100));  // Print the last 50 songs for verification
    // }

    await browser.close();
    return songs;
}



async function saveToDatabase(genreCode = "DM0000") {
    console.log(`🟢 Checking cache for genre: ${genreCode}`);

    // 1️⃣ Check if data is in cache and not expired
    const cachedData = cache.get(genreCode);
    if (cachedData && (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000)) {
        console.log(`✅ Loaded rankings from cache for genre: ${genreCode}`);
        return cachedData.data;
    }

    console.log(`🟢 Cache expired or missing. Fetching new data...`);
    console.log(`🟢 saveToDatabase() started for genre: ${genreCode}`);


    const client = await pool.connect();

    try {
        console.log(`🟢 Processing genre: ${genreCode}, scraping songs...`);
        const scrapedSongs = await scrapeMelonCharts(genreCode);

        await client.query('BEGIN'); // Start transaction

        // ✅ Ensure genre exists
        const genreResult = await client.query(
            `INSERT INTO genres (code, name) 
             VALUES ($1, $2) 
             ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name 
             RETURNING id`,
            [genreCode, genreMap[genreCode]]
        );
        const genreId = genreResult.rows[0].id;
        

        // ✅ Fetch all existing artists to prevent duplicates
        const existingArtistsRes = await client.query(`SELECT id, name FROM artists`);
        const existingArtists = new Map(existingArtistsRes.rows.map(a => [a.name, a.id]));

        // ✅ Insert or update artists
        const artistIds = {};
        for (const song of scrapedSongs) {
            if (!existingArtists.has(song.artist)) {
                const artistRes = await client.query(
                    `INSERT INTO artists (name) VALUES ($1) 
                     ON CONFLICT (name) DO NOTHING RETURNING id`,
                    [song.artist]
                );
                if (artistRes.rows.length > 0) {
                    artistIds[song.artist] = artistRes.rows[0].id;
                    existingArtists.set(song.artist, artistRes.rows[0].id);
                } else {
                    artistIds[song.artist] = existingArtists.get(song.artist);
                }
            } else {
                artistIds[song.artist] = existingArtists.get(song.artist);
            }
        }

        // ✅ Fetch existing songs to prevent duplicates
        const existingSongsRes = await client.query(`SELECT id, title, artist_id FROM songs`);
        const existingSongs = new Map(existingSongsRes.rows.map(s => [`${s.title}-${s.artist_id}`, s.id]));

        // ✅ Insert or update songs
        const songIds = {};
        for (const song of scrapedSongs) {
            const songKey = `${song.title}-${artistIds[song.artist]}`;

            if (!existingSongs.has(songKey)) {
                const songRes = await client.query(
                    `INSERT INTO songs (title, artist_id, album, art, youtube_url, genius_url, spotify_url, apple_music_url, scraped_at) 
                     VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, NOW()) 
                     RETURNING id;`,
                    [song.title, artistIds[song.artist], song.album, song.art]
                );
                songIds[songKey] = songRes.rows[0].id;
                existingSongs.set(songKey, songRes.rows[0].id);
            } else {
                songIds[songKey] = existingSongs.get(songKey);
            }
        }

        // ✅ Fetch previous rankings from the database
        const previousRankingsRes = await client.query(
            `SELECT song_id FROM song_rankings WHERE genre_id = $1 AND rank != 'N/A'`,
            [genreId]
        );
        const previousRankings = new Set(previousRankingsRes.rows.map(row => row.song_id));

        // ✅ Track songs in the current scrape
        const currentlyRankedSongs = new Set();

        // ✅ Insert or update rankings for songs found in the scrape
        for (const song of scrapedSongs) {
            const songId = songIds[`${song.title}-${artistIds[song.artist]}`];
            currentlyRankedSongs.add(songId);

            // ✅ Check if song already has a ranking
            const existingRankingRes = await client.query(
                `SELECT rank FROM song_rankings WHERE song_id = $1 AND genre_id = $2`,
                [songId, genreId]
            );

            if (existingRankingRes.rows.length > 0) {
                await client.query(
                    `UPDATE song_rankings 
             SET rank = $1, scraped_at = NOW() 
             WHERE song_id = $2 AND genre_id = $3;`,
                    [song.rank, songId, genreId]
                );
            } else {
                await client.query(
                    `INSERT INTO song_rankings (song_id, genre_id, rank, scraped_at) 
             VALUES ($1, $2, $3, NOW());`,
                    [songId, genreId, song.rank]
                );
            }
        }

        // ✅ Immediately set rank to "N/A" for missing songs
        for (const songId of previousRankings) {
            if (!currentlyRankedSongs.has(songId)) {
                await client.query(
                    `UPDATE song_rankings 
             SET rank = 'N/A', scraped_at = NOW() 
             WHERE song_id = $1 AND genre_id = $2;`,
                    [songId, genreId]
                );
                console.log(`⚠️ Song ID ${songId} dropped off the rankings, updated to N/A.`);
            }
        }

        // ✅ Update last_updated timestamp for the genre
        await client.query(`
            UPDATE genres 
            SET last_updated = NOW() 
            WHERE code = $1;
        `, [genreCode]);

        // ✅ Store in cache (expires in 24h)
        cache.set(genreCode, { data: scrapedSongs, timestamp: Date.now() });

        await client.query('COMMIT');
        console.log(`✅ Successfully updated rankings for genre: ${genreCode}!`);
        return scrapedSongs;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error saving to database:", error);
    } finally {
        client.release();
    }
}


// ✅ Map genre codes to readable names
const genreMap = {
    "DM0000": "Top 100",
    "GN0100": "Ballads",
    "GN0200": "K-Pop",
    "GN0300": "K-Rap",
    "GN0400": "R&B",
    "GN0500": "Indie",
    "GN0600": "Rock",
    "GN0700": "Trot",
    "GN0800": "Folk",
    "GN1500": "OST",
    "GN1700": "Jazz",
    "GN1800": "New Age",
    "GN1900": "J-Pop",
    "GN2200": "Children",
    "GN2400": "Korean Traditional",
};

module.exports = { scrapeMelonCharts, saveToDatabase };
