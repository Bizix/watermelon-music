const puppeteer = require('puppeteer');
const pool = require('../config/db');

async function scrapeMelonCharts() {
    console.log("🚀 Starting Melon chart scraping...");
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.melon.com/chart/index.htm', {
        waitUntil: 'domcontentloaded'
    });

    const songs = await page.evaluate(() => {
        const rankAr = document.querySelectorAll("#lst50 .rank, #lst100 .rank");
        const titleAr = document.querySelectorAll(".rank01>span>a");
        const artistAr = document.querySelectorAll(".rank02>span>a");
        const albumAr = document.querySelectorAll(".rank03>a");
        const artAr = document.querySelectorAll(".image_typeAll>img");
        const keyAr = document.querySelectorAll("tr[data-song-no]");

        let extractedSongs = [];

        rankAr.forEach((ranking, index) => {
            let rank = ranking.textContent.trim();
            let title = titleAr[index].textContent.trim();
            let artist = artistAr[index].textContent.trim();
            let album = albumAr[index].textContent.trim();
            let art = artAr[index].src.trim();
            let key = keyAr[index].getAttribute("data-song-no");
            let trackGenre = "Unknown"; // Will update genre extraction later

            extractedSongs.push({
                rank: parseInt(rank, 10),
                title,
                artist,
                album,
                art,
                key,
                genre: trackGenre
            });
        });

        return extractedSongs;
    });

    await browser.close();
    console.log(`✅ Successfully scraped ${songs.length} songs.`);
    return songs;
}

async function saveToDatabase() {
    try {
        const songs = await scrapeMelonCharts();
        
        for (let song of songs) {
            let artistResult = await pool.query(
                `INSERT INTO artists (name) VALUES ($1) 
                ON CONFLICT (name) DO NOTHING RETURNING id`,
                [song.artist]
            );

            let artistId = artistResult.rows[0]?.id || (
                await pool.query('SELECT id FROM artists WHERE name=$1', [song.artist])
            ).rows[0].id;

            await pool.query(
                `INSERT INTO songs (title, artist_id, genre, rank, youtube_url, genius_url, spotify_url, apple_music_url, scraped_at) 
                 VALUES ($1, $2, $3, $4, NULL, NULL, NULL, NULL, NOW()) 
                 ON CONFLICT DO NOTHING`,
                [song.title, artistId, song.genre, song.rank]
            );
        }

        console.log("✅ Melon charts successfully saved to database!");
    } catch (error) {
        console.error("❌ Error saving to database:", error);
    }
}

module.exports = { scrapeMelonCharts, saveToDatabase };
