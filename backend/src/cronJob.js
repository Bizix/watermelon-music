const cron = require("node-cron");
const { getRankings } = require("./services/rankingsService"); // Import your scraper function
const genreMap = {
    DM0000: "Top 100",
    GN0100: "Ballads",
    GN0200: "K-Pop",
    GN0300: "K-Rap",
    GN0400: "R&B",
    GN0500: "Indie",
    GN0600: "Rock",
    GN0700: "Trot",
    GN0800: "Folk",
    GN1500: "OST",
    GN1700: "Jazz",
    GN1800: "New Age",
    GN1900: "J-Pop",
    GN2200: "Children",
    GN2400: "Korean Traditional",
  };

async function runScraperForAllGenres() {
  console.log("⏳ Running scheduled Melon chart scraper...");
  for (const [genre, code] of Object.entries(genreMap)) {
    try {
      console.log(`📡 Scraping for genre: ${genre} (${code})...`);
      const songs = await getRankings(code);
      console.log(`✅ Finished scraping ${genre}. Scraped ${songs.length} songs.`);
    } catch (error) {
      console.error(`❌ Error scraping ${genre}:`, error);
    }
  }
  console.log("🎯 All genres processed.");
}

// ⏰ Run every minute for testing
cron.schedule("*/1 * * * *", () => {
    console.log("🔄 Running scheduled job (Every 1 Minute for Testing)...");
    runScraperForAllGenres();
  });


// // Schedule the scraper to run once every 24 hours (e.g., at midnight server time)
// cron.schedule("0 0 * * *", () => {
//   console.log("🔄 Starting scheduled job at midnight...");
//   runScraperForAllGenres();
// });

console.log("✅ Cron job scheduled: Scraper will run daily at midnight.");
