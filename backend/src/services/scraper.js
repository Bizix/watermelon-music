const puppeteer = require("puppeteer");

/**
 * ✅ Scrape Melon Chart Rankings for a Given Genre
 * @param {string} genreCode
 * @returns {Promise<Object[]>} Scraped songs
 */
async function scrapeMelonCharts(genreCode = "DM0000") {
  console.log(`🚀 Scraping Melon chart for genre: ${genreCode}...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const genreUrl = `https://www.melon.com/chart/day/index.htm?classCd=${genreCode}`;
  await page.goto(genreUrl, { waitUntil: "networkidle2" });

  console.log(`🟢 Opened Melon chart page for genre: ${genreCode}`);

  const songs = await page.evaluate(() => {
    const rankAr = document.querySelectorAll(".lst50 .rank, .lst100 .rank");
    const titleAr = document.querySelectorAll(".lst50 .rank01>span>a, .lst100 .rank01>span>a");
    const artistContainers = document.querySelectorAll(".lst50 .rank02, .lst100 .rank02");
    const albumAr = document.querySelectorAll(".lst50 .rank03>a, .lst100 .rank03>a");
    const artAr = document.querySelectorAll(".lst50 .image_typeAll img, .lst100 .image_typeAll img");
    const keyAr = document.querySelectorAll(".lst50[data-song-no], .lst100[data-song-no]");

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

  await browser.close();
  return songs;
}

module.exports = { scrapeMelonCharts };
