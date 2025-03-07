const { saveToDatabase } = require('../services/scraper'); // ✅ Import actual scraper logic

/**
 * Scrapes rankings for a given genre and saves them to the database.
 * @param {string} genreCode - The genre code (e.g., "DM0000" for Top 100).
 * @returns {Promise<void>}
 */
async function scrapeAndSaveGenre(genreCode) {
    try {
        console.log(`🔄 Starting scraping process for genre: ${genreCode}`);
        await saveToDatabase(genreCode);
        console.log(`✅ Successfully scraped and saved rankings for genre: ${genreCode}`);
    } catch (error) {
        console.error(`❌ Scraping failed for genre ${genreCode}:`, error);
        throw new Error(`Scraping process failed: ${error.message}`);
    }
}

module.exports = { scrapeAndSaveGenre };
