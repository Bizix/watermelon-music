const puppeteer = require('puppeteer');
const pool = require('../config/db');

async function scrapeMelonCharts() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://www.melon.com/chart/index.htm', {
        waitUntil: 'domcontentloaded'
    });

    const songs = await page.evaluate(() => {
        const rows = document.querySelectorAll('.lst50, .lst100'); // Melon's chart list
        return Array.from(rows).map(row => ({
            rank: row.querySelector('.rank')?.textContent.trim(),
            title: row.querySelector('.rank01 span')?.textContent.trim(),
            artist: row.querySelector('.rank02 span')?.textContent.trim(),
            genre: 'Unknown' // We'll update this later with translations
        }));
    });

    await browser.close();
    return songs;
}

// Save scraped data to PostgreSQL
async function saveToDatabase() {
    try {
        const songs = await scrapeMelonCharts();

        for (let song of songs) {
            let artistResult = await pool.query(
                'INSERT INTO artists (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
                [song.artist]
            );
            let artistId = artistResult.rows[0]?.id || (
                await pool.query('SELECT id FROM artists WHERE name=$1', [song.artist])
            ).rows[0].id;

            await pool.query(
                'INSERT INTO songs (title, artist_id, rank) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [song.title, artistId, song.rank]
            );
        }

        console.log('Melon charts successfully scraped and saved!');
    } catch (error) {
        console.error('Error saving to database:', error);
    }
}

// Export for use in other parts of the backend
module.exports = { scrapeMelonCharts, saveToDatabase };
