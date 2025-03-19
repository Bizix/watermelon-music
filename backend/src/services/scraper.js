const puppeteer = require("puppeteer");

async function scrapeMelonCharts(genreCode = "DM0000") {
  console.log(`🚀 Scraping Melon chart for genre: ${genreCode}...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const genreUrl = `https://www.melon.com/chart/day/index.htm?classCd=${genreCode}`;
  await page.goto(genreUrl, { waitUntil: "networkidle2" });

  console.log(`🟢 Opened Melon chart page for genre: ${genreCode}`);

  const songs = await page.evaluate(() => {
    const songRows = document.querySelectorAll(".lst50, .lst100"); // Select rows directly

    return Array.from(songRows).map((row) => {
      const rank = row.querySelector(".rank")?.textContent.trim();
      const movementEl = row.querySelector(".rank_wrap");

      const titleElement = row.querySelector(".rank01>span>a, .rank01>span>span");
      const title = titleElement ? titleElement.textContent.trim() : "Unknown Title";

      // Artist handling
      const artistContainer = row.querySelector(".rank02");
      let artistNames = new Set();
      if (artistContainer) {
        artistContainer.querySelectorAll("a").forEach((a) => {
          if (!a.classList.contains("disabled")) {
            artistNames.add(a.textContent.trim());
          }
        });
      }
      const artist = artistNames.size > 0 ? Array.from(artistNames).join(", ") : "Unknown Artist";

      const album = row.querySelector(".rank03>a")?.textContent.trim() || "Unknown Album";
      const art = row.querySelector(".image_typeAll img")?.getAttribute("src")?.trim() || "No Image Found";
      const key = row.getAttribute("data-song-no") || "000000";

      // Extract movement
      let movement = "-";
      if (movementEl) {
        if (movementEl.querySelector(".rank_new")) {
          movement = "NEW";
        } else if (movementEl.querySelector(".rank_up")) {
          movement = `↑ ${movementEl.querySelector(".up")?.textContent.trim()}`;
        } else if (movementEl.querySelector(".rank_down")) {
          movement = `↓ ${movementEl.querySelector(".down")?.textContent.trim()}`;
        }
      }

      return { rank: parseInt(rank, 10), title, artist, album, art, key, movement };
    });
  });

  await browser.close();

  return songs;
}

module.exports = { scrapeMelonCharts };
