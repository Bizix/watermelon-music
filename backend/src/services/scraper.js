const puppeteer = require('puppeteer');
const pool = require('../config/db');

async function scrapeMelonCharts(genreCode = "DM0000") {
    console.log(`🚀 Scraping Melon chart for genre: ${genreCode}...`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const genreUrl = `https://www.melon.com/chart/day/index.htm?classCd=${genreCode}`;
    
    await page.goto(genreUrl, { waitUntil: 'networkidle2' });

    console.log(`🟢 Opened Melon chart page for genre: ${genreCode}`);

    // Scraping logic remains the same...
    const songs = await page.evaluate(() => {
        const rankAr = document.querySelectorAll("#lst50 .rank, #lst100 .rank");
        const titleAr = document.querySelectorAll(".rank01>span>a");
        const artistAr = document.querySelectorAll(".rank02>span>a");
        const albumAr = document.querySelectorAll(".rank03>a");
        const artAr = document.querySelectorAll(".image_typeAll img");
        const keyAr = document.querySelectorAll("tr[data-song-no]");

        return Array.from(rankAr).map((ranking, index) => ({
            rank: parseInt(ranking.textContent.trim(), 10),
            title: titleAr[index]?.textContent.trim() || "Unknown Title",
            artist: artistAr[index]?.textContent.trim() || "Unknown Artist",
            album: albumAr[index]?.textContent.trim() || "Unknown Album",
            art: artAr[index]?.getAttribute("src")?.trim() || "No Image Found",
            key: keyAr[index]?.getAttribute("data-song-no") || "000000",
        }));
    });

    console.log(`✅ Successfully scraped ${songs.length} songs for genre: ${genreCode}`);
    await browser.close();

    return songs;
}


async function saveToDatabase(genreCode = "DM0000") {
    const client = await pool.connect();

    try {
        console.log(`🟢 Processing genre: ${genreCode}, scraping songs...`);
        const songs = await scrapeMelonCharts(genreCode);

        await client.query('BEGIN'); // Start transaction

        // ✅ Ensure genre exists
        let genreResult = await client.query(
            `INSERT INTO genres (code, name) 
             VALUES ($1, $2) 
             ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name 
             RETURNING id`,
            [genreCode, genreMap[genreCode]]
        );
        let genreId = genreResult.rows[0].id;

        // ✅ Insert or update artists
        const artistIds = {};
        for (const song of songs) {
            let artistRes = await client.query(
                `INSERT INTO artists (name) VALUES ($1) 
                 ON CONFLICT (name) DO NOTHING RETURNING id`,
                [song.artist]
            );

            artistIds[song.artist] = artistRes.rows[0]?.id ||
                (await client.query('SELECT id FROM artists WHERE name=$1', [song.artist])).rows[0]?.id;
        }

        // ✅ Insert or update songs and retrieve `song_id`
        const songIds = {};
        for (const song of songs) {
            let songRes = await client.query(
                `INSERT INTO songs (title, artist_id, album, art, youtube_url, genius_url, spotify_url, apple_music_url, scraped_at) 
                 VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, NOW()) 
                 ON CONFLICT (title, artist_id) DO UPDATE 
                 SET scraped_at = NOW() RETURNING id;`,
                [song.title, artistIds[song.artist], song.album, song.art]
            );

            songIds[song.title] = songRes.rows[0].id;
        }

        // ✅ Insert or update song rankings per genre
        for (const song of songs) {
            let songId = songIds[song.title];  // ✅ Use correct `song_id`
            await client.query(
                `INSERT INTO song_rankings (song_id, genre_id, rank, scraped_at) 
                 VALUES ($1, $2, $3, NOW()) 
                 ON CONFLICT (song_id, genre_id) DO UPDATE 
                 SET rank = EXCLUDED.rank, scraped_at = NOW();`,
                [songId, genreId, song.rank]
            );
        }

        await client.query('COMMIT'); // ✅ Commit transaction
        console.log(`✅ Successfully updated rankings for genre: ${genreCode}!`);

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error("❌ Error saving to database:", error);
    } finally {
        client.release(); // ✅ Release connection
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
    "GN2400" : "Korean Traditional",
};



module.exports = { scrapeMelonCharts, saveToDatabase };
