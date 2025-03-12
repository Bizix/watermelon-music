const puppeteer = require("puppeteer");
const axios = require("axios");
const pool = require("../config/db");
const { getCache, setCache } = require("./cacheService");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

/**
 * ✅ Get Lyrics (Check DB first, otherwise scrape)
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<string|null>} - Lyrics or null if not found
 */
async function getLyrics(title, artist) {
    const cacheKey = `lyrics_${title}_${artist}`;
  
    console.log(`🟢 Checking cache for lyrics: ${title} - ${artist}`);
  
    // ✅ Check cache first
    const cachedLyrics = getCache(cacheKey);
    if (cachedLyrics) {
      console.log(`✅ Loaded lyrics from cache for: ${title} - ${artist}`);
      return cachedLyrics;
    }
  
    console.log(`🔎 Checking database for lyrics: ${title} - ${artist}`);
  
    const client = await pool.connect();
    try {
      // ✅ Check if lyrics are already in the database
      const result = await client.query(
        `SELECT sl.lyrics FROM song_lyrics sl
           JOIN songs s ON sl.song_id = s.id
           JOIN artists a ON s.artist_id = a.id
           WHERE s.title = $1 AND a.name = $2
           LIMIT 1`,
        [title, artist]
      );
  
      if (result.rows.length > 0) {
        const lyrics = result.rows[0].lyrics;
        console.log(`✅ Loaded lyrics from database for: ${title} - ${artist}`);
  
        // ✅ Cache the lyrics to prevent repeated DB queries
        setCache(cacheKey, lyrics);
        return lyrics;
      }
    } finally {
      client.release();
    }
  
    // ✅ If not in DB, scrape from Genius
    console.log(`🕵️ Searching Google for lyrics: ${title} - ${artist}`);
    const lyrics = await searchGeniusLyrics(title, artist);
  
    if (lyrics) {
      // ✅ Store in cache so we don’t scrape again soon
      setCache(cacheKey, lyrics);
    }
  
    return lyrics;
  }
  

/**
 * ✅ Search for Genius lyrics using Google Search API
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<string|null>} - Scraped lyrics or null
 */
async function searchGeniusLyrics(title, artist) {
  try {
    const query = `${title} ${artist} Genius English Translation`;
    console.log(`🔎 Searching Google API for lyrics: ${query}`);

    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1`,
      {
        params: {
          key: GOOGLE_API_KEY,
          cx: GOOGLE_CSE_ID,
          q: query,
          num: 1,
        },
      }
    );

    const items = response.data.items || [];

    console.log(
      "🔗 Google API results:",
      items.map((item) => item.link)
    );

    // ✅ Find the first Genius result with "English Translation"
    let geniusLink = items.find(
        (item) =>
          item.link.toLowerCase().includes("genius.com") &&
          item.link.toLowerCase().includes("english-translation")
      );

    if (!geniusLink) {
      console.warn(
        `⚠️ No Genius English Translation found for: ${title} - ${artist}`
      );
      return null;
    }

    console.log(`🔗 Found Genius lyrics page: ${geniusLink.link}`);
    return await scrapeLyricsFromGenius(geniusLink.link, title, artist);
  } catch (error) {
    console.error(
      "❌ Google Search API Error:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * ✅ Scrape Genius Lyrics Page & Fetch Annotations
 * @param {string} url - Genius lyrics page URL
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<string|null>} - Extracted lyrics
 */
async function scrapeLyricsFromGenius(url, title, artist) {
    console.log(`📜 Scraping lyrics from Genius: ${url}`);
  
    const browser = await puppeteer.launch({
      headless: "new", // Helps avoid bot detection
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
  
    try {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      );
  
      console.log(`🚀 Navigating to Genius page...`);
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  
      await page.waitForSelector("[data-lyrics-container]", { timeout: 20000 });
  
      console.log(`🔍 Looking for visible lyrics...`);
      const lyrics = await page.$$eval("[data-lyrics-container]", (containers) =>
        containers.map((c) => c.innerText).join("\n")
      );
  
      if (!lyrics) {
        console.warn(`⚠️ No lyrics found on page, checking referents...`);
        await browser.close();
        return null;
      }
  
      console.log(`✅ Successfully scraped lyrics!`);
  
      // ✅ Store in the database
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO song_lyrics (song_id, lyrics) 
               VALUES (
                 (SELECT id FROM songs WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2) LIMIT 1), 
                 $3
               ) 
               ON CONFLICT (song_id) 
               DO UPDATE SET lyrics = EXCLUDED.lyrics RETURNING *`,
          [title, artist, lyrics]
        );
      } finally {
        client.release();
      }
  
      // ✅ Store in cache so we don’t scrape again soon
      const cacheKey = `lyrics_${title}_${artist}`;
      setCache(cacheKey, lyrics);
  
      return lyrics;
    } catch (error) {
      console.error("❌ Error scraping lyrics from Genius:", error);
      return null;
    } finally {
      await browser.close();
    }
  }
  
// ✅ Export the functions
module.exports = { getLyrics, scrapeLyricsFromGenius };
