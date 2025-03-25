const { connect } = require("puppeteer-real-browser");
const axios = require("axios");
const pool = require("../config/db");
const { getCache, setCache } = require("./cacheService");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

/**
 * ✅ Get Lyrics (Check DB first, otherwise scrape)
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {string} songId - Melon song ID
 * @returns {Promise<string|null>} - Lyrics or null if not found
 */
async function getLyrics(title, artist, songId) {
  const cacheKey = `lyrics_${songId}`;

  // ✅ Check cache before querying the database
  const cachedLyrics = getCache(cacheKey);
  if (cachedLyrics) {
    console.log(`✅ Using cached lyrics for ${title} - ${artist}`);
    return cachedLyrics;
  }

  console.log(`🔎 Checking database for lyrics: ${title} - ${artist}`);
  const client = await pool.connect();
  try {
    // ✅ Fetch lyrics, eng_saved, and updated_at from database
    const result = await client.query(
      `SELECT sl.lyrics, sl.eng_saved, sl.updated_at 
       FROM song_lyrics sl
       JOIN songs s ON sl.song_id = s.id
       JOIN artists a ON s.artist_id = a.id
       WHERE s.title = $1 AND a.name = $2
       LIMIT 1`,
      [title, artist]
    );

    if (result.rows.length > 0) {
      let { lyrics, eng_saved, updated_at } = result.rows[0];

      // ✅ Only cache lyrics if they exist
      if (lyrics) {
        setCache(cacheKey, lyrics);
      }

      // ✅ Convert `updated_at` to Date and check if it's over 1 month old
      const lastUpdated = new Date(updated_at);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      if (!eng_saved && lastUpdated < oneMonthAgo) {
        console.log(
          `🔄 Lyrics are outdated and not English. Rechecking Genius...`
        );

        // ✅ Attempt to get new Genius lyrics
        const geniusLyrics = await searchGeniusLyrics(title, artist, songId);

        if (geniusLyrics) {
          console.log(`✅ Found new Genius lyrics! Updating database...`);

          await client.query(
            `UPDATE song_lyrics 
             SET lyrics = $1, eng_saved = TRUE, updated_at = NOW()
             WHERE song_id = (SELECT id FROM songs WHERE title = $2 
                              AND artist_id = (SELECT id FROM artists WHERE name = $3) 
                              LIMIT 1)`,
            [geniusLyrics, title, artist]
          );
          setCache(cacheKey, geniusLyrics);
          return geniusLyrics;
        }
      }
      return lyrics;
    }
  } finally {
    client.release();
  }

  // ✅ If not in DB at all, scrape from Genius
  return await searchGeniusLyrics(title, artist, songId);
}

/**
 * ✅ Clean up and format fetched lyrics
 * @param {string} rawLyrics - The raw lyrics scraped from Genius
 * @returns {string} - Properly formatted lyrics
 */
function cleanLyrics(rawLyrics) {
  return rawLyrics
    .split("\n")
    .reduce((acc, line) => {
      line = line.trim();

      // ✅ If a line starts with a comma, attach it to the previous line
      if (line.startsWith(",") && acc.length > 0) {
        acc[acc.length - 1] += line;
        return acc;
      }

      // ✅ Add a blank line before section headers (e.g. [Verse 1: Artist])
      if (acc.length > 0 && line.match(/^\[.*\]$/)) {
        acc.push("");
      }

      acc.push(line);
      return acc;
    }, [])
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * ✅ Search for Genius lyrics using Google Search API
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {string} songId - Melon song ID
 * @returns {Promise<string|null>} - Scraped lyrics or null
 */
async function searchGeniusLyrics(title, artist, songId) {
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
          num: 2,
        },
      }
    );

    const items = response.data.items || [];
    console.log(
      "🔗 Google API results:",
      items.map((item) => item.link)
    );

    let geniusLink = items.find(
      (item) =>
        item.link.toLowerCase().includes("genius.com") &&
        item.link.toLowerCase().includes("english-translation")
    );

    if (!geniusLink) {
      console.warn(
        `⚠️ No Genius English Translation found. Scraping Melon instead...`
      );
      return await scrapeBackupLyrics(title, artist, songId);
    }

    console.log(`🔗 Found Genius lyrics page: ${geniusLink.link}`);
    return await scrapeLyricsFromGenius(geniusLink.link, title, artist, songId);
  } catch (error) {
    console.error(
      "❌ Google Search API Error:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * ✅ Scrape Genius Lyrics Page using puppeteer-real-browser
 * @param {string} url - Genius lyrics page URL
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {string} songId - Melon song ID
 * @returns {Promise<string|null>} - Extracted lyrics
 */
async function scrapeLyricsFromGenius(url, title, artist, songId) {
  console.log(`📜 Scraping lyrics from Genius: ${url}`);

  const { browser, page } = await connect({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled"
    ],
    // Use default customConfig; add any overrides if needed.
    customConfig: {},
    turnstile: true,
    connectOption: { defaultViewport: null },
    disableXvfb: false,
    ignoreAllFlags: false,
    // Optionally, add plugins if needed:
    // plugins: [require("puppeteer-extra-plugin-stealth")()],
  });

  let lyrics = null;

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    // Override navigator.webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    try {
      await page.waitForSelector("[data-lyrics-container]", { timeout: 60000 });
    } catch (error) {
      await page.screenshot({ path: "error-screenshot.png" });
      const htmlContent = await page.content();
      console.log(htmlContent);
      throw error;
    }

    const rawLyrics = await page.$$eval(
      "[data-lyrics-container]",
      (containers) => containers.map((c) => c.innerText).join("\n")
    );

    // Clean and format the lyrics
    lyrics = cleanLyrics(rawLyrics);

    if (lyrics) {
      setCache(`lyrics_${songId}`, lyrics);
      const client = await pool.connect();
      await client.query(
        `INSERT INTO song_lyrics (song_id, lyrics, eng_saved) 
         VALUES ((SELECT id FROM songs WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2) LIMIT 1), 
           $3, TRUE) 
         ON CONFLICT (song_id) DO UPDATE SET lyrics = EXCLUDED.lyrics, eng_saved = EXCLUDED.eng_saved`,
        [title, artist, lyrics]
      );
      client.release();
    }
  } catch (error) {
    console.error("❌ Error scraping lyrics from Genius:", error);
  } finally {
    await browser.close();
  }

  return lyrics;
}

/**
 * ✅ Scrape backup lyrics from Melon using puppeteer-real-browser
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {string} songId - Melon song ID
 * @returns {Promise<string|null>} - Extracted lyrics
 */
async function scrapeBackupLyrics(title, artist, songId) {
  console.log(`📜 Scraping backup lyrics from Melon for song ID: ${songId}`);

  const melonUrl = `https://www.melon.com/song/detail.htm?songId=${songId}`;
  console.log(`🔗 Navigating to: ${melonUrl}`);

  const { browser, page } = await connect({
    headless: true, // You can set headless to false for debugging
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    customConfig: {},
    turnstile: true,
    connectOption: { defaultViewport: null },
    disableXvfb: false,
    ignoreAllFlags: false,
  });

  let lyrics = null;
  let engSaved = false; // Backup method; set eng_saved to false

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    console.log(`🚀 Navigating to Melon song page...`);
    await page.goto(melonUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".lyric#d_video_summary", { timeout: 20000 });
    console.log(`🔍 Looking for lyrics container...`);

    // Extract lyrics from Melon page
    const rawLyrics = await page.$eval(
      ".lyric#d_video_summary",
      (el) => el.innerText
    );

    lyrics = cleanLyrics(rawLyrics);

    if (lyrics) {
      console.log(`✅ Successfully scraped Melon lyrics!`);
    } else {
      console.warn(`⚠️ No lyrics found on page: ${melonUrl}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error scraping backup lyrics from Melon:", error);
    return null;
  } finally {
    await browser.close();
  }

  // Store in the database
  let client;
  try {
    client = await pool.connect();
    const songResult = await client.query(
      `SELECT id FROM songs WHERE melon_song_id = $1 LIMIT 1`,
      [songId]
    );
    if (songResult.rows.length === 0) {
      throw new Error("Song not found in the database using melon_id.");
    }
    const songIdFromDB = songResult.rows[0].id;

    await client.query(
      `INSERT INTO song_lyrics (song_id, lyrics, eng_saved) 
       VALUES ($1, $2, $3)
       ON CONFLICT (song_id) 
       DO UPDATE SET lyrics = EXCLUDED.lyrics, eng_saved = EXCLUDED.eng_saved
       RETURNING *`,
      [songIdFromDB, lyrics, engSaved]
    );

    console.log(`✅ Melon lyrics saved to database.`);
  } finally {
    setCache(`lyrics_${songId}`, lyrics);
    if (client) client.release();
  }

  return lyrics;
}

// ✅ Export functions
module.exports = { getLyrics, scrapeLyricsFromGenius };
