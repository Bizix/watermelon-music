const cron = require("node-cron");
const { shouldScrapeGenre, getRankings } = require("./services/rankingsService");
const { scrapeAndSaveGenre } = require("./services/scraperService"); // ✅ make sure this path is correct

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

async function fetchData() {
  console.log("🔥 Warm-up / Scrape task triggered");
  
  for (const genreCode of Object.keys(genreMap)) {
    try {
      const shouldScrape = await shouldScrapeGenre(genreCode);

      if (shouldScrape) {
        console.log(`🔄 Scraping and saving genre: ${genreMap[genreCode]} (${genreCode})`);
        await scrapeAndSaveGenre(genreCode);
      } else {
        console.log(`⏩ Skipping scrape for ${genreMap[genreCode]} — already up to date`);
      }

      // ✅ Always fetch rankings to warm cache
      const rankings = await getRankings(genreCode);
      console.log(`✅ ${rankings.length} songs loaded for ${genreMap[genreCode]}`);

    } catch (err) {
      console.error(`❌ Error during cron job for genre ${genreCode}:`, err);
    }
  }
}

// 🔁 Run every 15 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("🕒 Cron job started (every 15 minutes)");
  fetchData();
});

console.log("🟢 Cron job initialized. Waiting for execution...");
