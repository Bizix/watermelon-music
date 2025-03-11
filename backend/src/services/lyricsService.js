const puppeteer = require("puppeteer");
const pool = require("../config/db");

/**
 * ✅ Get Lyrics (Check DB first, otherwise scrape)
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<string|null>} - Lyrics or null if not found
 */
async function getLyrics(title, artist) {
  console.log(`🔎 Checking database for lyrics: ${title} - ${artist}`);

  const client = await pool.connect();
  try {
    // ✅ Check if lyrics are already in the database
    const result = await client.query(
      `SELECT lyrics FROM song_lyrics 
       WHERE title = $1 AND artist = $2 LIMIT 1`,
      [title, artist]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Loaded lyrics from database for: ${title} - ${artist}`);
      return result.rows[0].lyrics;
    }
  } finally {
    client.release();
  }

  // ✅ If not in DB, scrape from Genius
  console.log(`🕵️ Searching Google for lyrics: ${title} - ${artist}`);
  return await scrapeGeniusLyrics(title, artist);
}

/**
 * ✅ Search Google & Scrape Genius Lyrics
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<string|null>} - Scraped lyrics or null
 */
async function scrapeGeniusLyrics(title, artist) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const searchQuery = `${title} ${artist} Genius English Translation`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

  try {
    await page.goto(googleSearchUrl, { waitUntil: "domcontentloaded" });

    // ✅ Find the first Genius link that includes "English Translation"
    const links = await page.$$eval("a", (anchors) =>
      anchors.map((a) => ({ href: a.href, text: a.innerText }))
    );

    const geniusLink = links.find(
      (link) =>
        link.href.includes("genius.com") && link.text.toLowerCase().includes("english translation")
    );

    if (!geniusLink) {
      console.warn(`⚠️ No Genius English Translation found for: ${title} - ${artist}`);
      await browser.close();
      return null;
    }

    console.log(`🔗 Found Genius page: ${geniusLink.href}`);
    await page.goto(geniusLink.href, { waitUntil: "domcontentloaded" });

    // ✅ Scrape lyrics from the correct element
    const lyrics = await page.$$eval("[data-lyrics-container]", (containers) =>
      containers.map((c) => c.innerText).join("\n")
    );

    await browser.close();

    if (!lyrics) {
      console.warn(`⚠️ Failed to scrape lyrics for: ${title} - ${artist}`);
      return null;
    }

    console.log(`✅ Successfully scraped lyrics for: ${title} - ${artist}`);

    // ✅ Save lyrics to the database
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO song_lyrics (title, artist, lyrics) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (title, artist) 
         DO UPDATE SET lyrics = EXCLUDED.lyrics`,
        [title, artist, lyrics]
      );
    } finally {
      client.release();
    }

    return lyrics;
  } catch (error) {
    console.error(`❌ Error scraping lyrics:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = { getLyrics };
