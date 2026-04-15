const express = require("express");
const router = express.Router();
const {
  getLastGenreIndex,
  saveGenreIndex,
} = require("../services/rotationService");
const { getRankings } = require("../services/rankingsService");
const { queueGenreRefresh } = require("../services/chartRefreshService");

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

const genreCodes = Object.keys(genreMap);

router.get("/cron", async (req, res) => {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.status(202).json({ message: "🕒 Scraping started in background" });

  const lastIndex = await getLastGenreIndex();
  const genreCode = genreCodes[lastIndex];
  const genreName = genreMap[genreCode];
  const nextIndex = (lastIndex + 1) % genreCodes.length;

  try {
    const refresh = await queueGenreRefresh(genreCode, {
      reason: "cron_refresh",
    });

    if (refresh.promise) {
      await refresh.promise;
    } else {
      console.log(`⏩ Skipping ${genreName} — up to date`);
      await getRankings(genreCode); // warm cache if we only hit the DB path
    }

    await saveGenreIndex(nextIndex);

  } catch (err) {
    console.error("❌ Error in cron route:", err.message);
  }
  console.log(`[CRON] ✅ Finished genre: ${genreCode}`);
});

module.exports = router;
