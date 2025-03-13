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
    const movementAr = document.querySelectorAll(
      ".lst50 .rank_wrap, .lst100 .rank_wrap"
    );
    const titleAr = document.querySelectorAll(
      ".lst50 .rank01>span>a, .lst100 .rank01>span>a, .lst50 .rank01>span>span, .lst100 .rank01>span>span"
    );
    
    const artistContainers = document.querySelectorAll(
      ".lst50 .rank02, .lst100 .rank02"
    );
    const albumAr = document.querySelectorAll(
      ".lst50 .rank03>a, .lst100 .rank03>a"
    );
    const artAr = document.querySelectorAll(
      ".lst50 .image_typeAll img, .lst100 .image_typeAll img"
    );
    const keyAr = document.querySelectorAll(
      ".lst50[data-song-no], .lst100[data-song-no]"
    );

    return Array.from(rankAr).map((ranking, index) => {
      const rank = ranking.textContent.trim().match(/\d+/) ? parseInt(ranking.textContent.trim(), 10) : null;

      const titleElement = titleAr[index];
      let title = "Unknown Title";
      
      if (titleElement) {
        // ✅ If inside `<a>`, extract text
        if (titleElement.tagName.toLowerCase() === "a") {
          title = titleElement.textContent.trim();
        }
        // ✅ If inside `<span>`, extract text (handles disabled titles)
        else if (titleElement.tagName.toLowerCase() === "span") {
          title = titleElement.textContent.trim();
        }
      }
      
      // ✅ Extract artists properly from both lists
      const artistContainer = artistContainers[index];
      let artistNames = new Set();
      
      if (artistContainer) {
        // ✅ Extract visible artist names
        artistContainer.querySelectorAll("a").forEach((a) => {
          if (!a.classList.contains("disabled")) {
            artistNames.add(a.textContent.trim());
          }
        });
      
        // ✅ Check for hidden artists inside `.wrap_atist`
        const hiddenArtistContainer = artistContainer.querySelector(".wrap_atist .atist_view");
        if (hiddenArtistContainer) {
          hiddenArtistContainer.querySelectorAll("a").forEach((a) => {
            artistNames.add(a.textContent.trim());
          });
        }
      }
      
      // ✅ Convert Set to a string
      const artist = artistNames.size > 0 ? Array.from(artistNames).join(", ") : "Unknown Artist";

      const album = albumAr[index]?.textContent.trim() || "Unknown Album";
      const art = artAr[index]?.getAttribute("src")?.trim() || "No Image Found";
      const key = keyAr[index]?.getAttribute("data-song-no") || "000000";

      // ✅ Extract rank movement direction (up/down/static) and amount
      let movement = "-"; // Default: no change
      const movementEl = movementAr[index];

      if (movementEl) {
        const upEl = movementEl.querySelector(".bullet_icons.rank_up + .up");
        const downEl = movementEl.querySelector(
          ".bullet_icons.rank_down + .down"
        );
        const staticEl = movementEl.querySelector(".bullet_icons.rank_static");
        const newEl = movementEl.querySelector(".bullet_icons.rank_new");

        if (newEl) {
          movement = "NEW";
        } else if (upEl) {
          movement = `↑ ${upEl.textContent.trim()}`;
        } else if (downEl) {
          movement = `↓ ${downEl.textContent.trim()}`;
        } else if (staticEl) {
          movement = "-";
        }
      }

      return { rank, title, artist, album, art, key, movement };
    });
  });

  await browser.close();
  return songs;
}

module.exports = { scrapeMelonCharts };
