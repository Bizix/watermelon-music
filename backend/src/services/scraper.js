const puppeteer = require('puppeteer');
const pool = require('../config/db');

async function scrapeMelonCharts() {
    console.log("🚀 Starting Melon chart scraping...");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.melon.com/chart/index.htm', {
        waitUntil: 'networkidle2'
    });

    console.log("🟢 Puppeteer opened page, waiting for elements...");
    await page.waitForSelector("td .image_typeAll img", { timeout: 5000 });

    console.log("🟢 Puppeteer starting evaluation...");
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

    console.log("🟢 Puppeteer finished evaluating page.");
    await browser.close();
    console.log(`✅ Successfully scraped ${songs.length} songs.`);
    return songs;
}

async function saveToDatabase(genre = "Top 100") {
    const client = await pool.connect(); // ✅ Use transactions to optimize inserts

    try {
        console.log(`🟢 Processing ${genre} genre, scraping songs...`);
        const songs = await scrapeMelonCharts();

        // ✅ Start transaction
        await client.query('BEGIN');

        // ✅ Ensure genre exists and get genreId
        let genreResult = await client.query(
            `INSERT INTO genres (name) VALUES ($1) 
             ON CONFLICT (name) DO NOTHING RETURNING id`,
            [genre]
        );

        let genreId = genreResult.rows[0]?.id;
        if (!genreId) {
            const existingGenre = await client.query('SELECT id FROM genres WHERE name=$1', [genre]);
            genreId = existingGenre.rows[0]?.id;
        }

        // ✅ Insert artists and retrieve artist IDs in parallel
        const artistIds = {};
        for (const song of songs) {
            let artistRes = await client.query(
                `INSERT INTO artists (name) VALUES ($1) 
                 ON CONFLICT (name) DO NOTHING RETURNING id`,
                [song.artist]
            );

            if (artistRes.rows.length > 0) {
                artistIds[song.artist] = artistRes.rows[0].id;
            } else {
                const existingArtist = await client.query('SELECT id FROM artists WHERE name=$1', [song.artist]);
                artistIds[song.artist] = existingArtist.rows[0].id;
            }
        }

        // ✅ Insert songs in batches for better performance
        const songValues = songs.map(song => [
            song.title,
            artistIds[song.artist],
            genreId,
            song.rank,
            song.album,
            song.art
        ]);

        const queryText = `
            INSERT INTO songs (title, artist_id, genre_id, rank, album, art, youtube_url, genius_url, spotify_url, apple_music_url, scraped_at)
            VALUES ${songValues.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6}, NULL, NULL, NULL, NULL, NOW())`).join(", ")}
            ON CONFLICT (title, artist_id) DO UPDATE 
            SET album = COALESCE(EXCLUDED.album, songs.album), 
            art = COALESCE(EXCLUDED.art, songs.art);
        `;

        // ✅ Flatten songValues to match query parameters
        const flattenedValues = songValues.flat();
        await client.query(queryText, flattenedValues);

        // ✅ Commit transaction
        await client.query('COMMIT');

        console.log("✅ Melon charts successfully saved to database!");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Error saving to database:", error);
    } finally {
        client.release(); // ✅ Release database connection
    }
}

module.exports = { scrapeMelonCharts, saveToDatabase };
