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
 * @param {string} songId - Melon song ID
 * @returns {Promise<string|null>} - Lyrics or null if not found
 */
async function getLyrics(title, artist, songId) {
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

      console.log(`✅ Lyrics found in database. Checking conditions...`);

      // ✅ Convert `updated_at` to Date and check if it's over 1 month old
      const lastUpdated = new Date(updated_at);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      if (!eng_saved && lastUpdated < oneMonthAgo) {
        console.log(`🔄 Lyrics are over 1 month old and not English. Rechecking Genius...`);

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

          // ✅ Store updated lyrics in cache and return them
          setCache(cacheKey, geniusLyrics);
          return geniusLyrics;
        } else {
          console.log(`❌ Genius still has no English lyrics. Keeping existing Melon lyrics.`);

          // ✅ Ensure `eng_saved = FALSE` so we don't mistakenly think it's English
          await client.query(
            `UPDATE song_lyrics 
             SET updated_at = NOW(), eng_saved = FALSE 
             WHERE song_id = (SELECT id FROM songs WHERE title = $1 
                              AND artist_id = (SELECT id FROM artists WHERE name = $2) 
                              LIMIT 1)`,
            [title, artist]
          );
        }
      }

      console.log(`✅ Returning lyrics from database.`);
      setCache(cacheKey, lyrics);
      return lyrics;
    }
  } finally {
    client.release();
  }

  // ✅ If not in DB at all, scrape from Genius first
  console.log(`🕵️ Searching Google for lyrics: ${title} - ${artist}`);
  const lyrics = await searchGeniusLyrics(title, artist, songId);

  if (lyrics) {
    // ✅ Store in cache so we don’t scrape again soon
    setCache(cacheKey, lyrics);
  } else {
    console.log(`❌ No Genius lyrics found for a new song. Marking as non-English.`);

    // ✅ Ensure `eng_saved = FALSE` when inserting new lyrics from Melon
    await client.query(
      `INSERT INTO song_lyrics (song_id, lyrics, eng_saved, updated_at) 
       VALUES (
         (SELECT id FROM songs WHERE title = $1 
          AND artist_id = (SELECT id FROM artists WHERE name = $2) LIMIT 1), 
         $3, 
         FALSE, 
         NOW()
       ) 
       ON CONFLICT (song_id) 
       DO UPDATE SET 
         updated_at = NOW(), 
         eng_saved = FALSE
       RETURNING *`,
      [title, artist, lyrics || ""] // ✅ If lyrics are null, store an empty string
    );
  }

  return lyrics;
}


/**
 * ✅ Clean up and format fetched lyrics
 * @param {string} rawLyrics - The raw lyrics scraped from Genius
 * @returns {string} - Properly formatted lyrics
 */
function cleanLyrics(rawLyrics) {
  return rawLyrics
    .split("\n")
    .reduce((acc, line, index, arr) => {
      line = line.trim();

      // ✅ If a line starts with a comma, attach it to the previous line
      if (line.startsWith(",") && acc.length > 0) {
        acc[acc.length - 1] += line; // Move the comma to the previous line
        return acc;
      }

      // ✅ Ensure a blank line exists between verses, choruses, and other sections
      if (
        acc.length > 0 &&
        line.match(/^\[.*\]$/) // If line is a section header like [Verse 1: Artist]
      ) {
        acc.push(""); // Add a blank line before it
      }

      acc.push(line); // Add the line normally
      return acc;
    }, [])
    .join("\n") // ✅ Preserve correct newlines
    .replace(/\n{3,}/g, "\n\n") // ✅ Ensure no excessive blank lines
    .trim();
}

/**
 * ✅ Search for Genius lyrics using Google Search API
 * @param {string} title - Song title
 * @param {string} artist - Artist name
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

    // ✅ Find the first Genius result with "English Translation"
    let geniusLink = items.find(
      (item) =>
        item.link.toLowerCase().includes("genius.com") &&
        item.link.toLowerCase().includes("english-translation")
    );

    if (!geniusLink) {
      console.warn(`⚠️ No Genius English Translation found.`);
    
      // ✅ Only scrape from Melon if the song is NOT already in the database
      const existingLyricsCheck = await pool.query(
        `SELECT eng_saved FROM song_lyrics 
         WHERE song_id = (SELECT id FROM songs WHERE title = $1 
                          AND artist_id = (SELECT id FROM artists WHERE name = $2) 
                          LIMIT 1)`,
        [title, artist]
      );
    
      if (existingLyricsCheck.rows.length > 0) {
        console.log(`✅ Song already has lyrics in database. No need to re-scrape Melon.`);
        return null; // ✅ Do not scrape Melon again if lyrics already exist
      }
    
      console.log(`🔄 Song is new. Scraping Melon lyrics...`);
      return await scrapeBackupLyrics(title, artist, songId); // ✅ Only scrape Melon if lyrics don’t exist
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

  let lyrics = null;
  let engSaved = false;

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    console.log(`🚀 Navigating to Genius page...`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector("[data-lyrics-container]", { timeout: 20000 });

    console.log(`🔍 Looking for visible lyrics...`);
    const rawLyrics = await page.$$eval(
      "[data-lyrics-container]",
      (containers) => containers.map((c) => c.innerText).join("\n")
    );

    // ✅ Clean and format the lyrics before inserting into the database
    lyrics = cleanLyrics(rawLyrics); // ✅ Apply fix before saving

    if (lyrics) {
      engSaved = true; // ✅ Set engSaved to true since Genius was used
    } else {
      console.warn(`⚠️ No lyrics found on page: ${url}`);
    }
    if (!lyrics) return null;

    // ✅ Store in the database
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO song_lyrics (song_id, lyrics, eng_saved) 
        VALUES ((SELECT id FROM songs WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2) LIMIT 1), 
          $3, 
          $4) 
        ON CONFLICT (song_id) 
        DO UPDATE SET 
          lyrics = EXCLUDED.lyrics, 
          eng_saved = EXCLUDED.eng_saved
        RETURNING *`,
        [title, artist, lyrics, engSaved]
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

/**
 * ✅ Scrape Backup Lyrics from Melon
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {number} songId - Melon song ID
 * @returns {Promise<string|null>} - Scraped lyrics or null
 */
async function scrapeBackupLyrics(title, artist, songId) {
  console.log(`📜 Scraping backup lyrics from Melon for song ID: ${songId}`);

  const melonUrl = `https://www.melon.com/song/detail.htm?songId=${songId}`;
  console.log(`🔗 Navigating to: ${melonUrl}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  let lyrics = null;
  let engSaved = false; // ✅ Since this is a backup method, we set eng_saved to false

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );

    console.log(`🚀 Navigating to Melon song page...`);
    await page.goto(melonUrl, { waitUntil: "networkidle2", timeout: 60000 });

    await page.waitForSelector(".lyric#d_video_summary", { timeout: 20000 });

    console.log(`🔍 Looking for lyrics container...`);
    
    // ✅ Extract lyrics from Melon page
    const rawLyrics = await page.$eval(".lyric#d_video_summary", (el) => el.innerText);

    lyrics = cleanLyrics(rawLyrics); // ✅ Apply cleaning function

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

  // ✅ Store in the database
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO song_lyrics (song_id, lyrics, eng_saved) 
       VALUES (
         (SELECT id FROM songs WHERE title = $1 AND artist_id = (SELECT id FROM artists WHERE name = $2) LIMIT 1), 
         $3, 
         $4
       ) 
       ON CONFLICT (song_id) 
       DO UPDATE SET 
         lyrics = EXCLUDED.lyrics, 
         eng_saved = EXCLUDED.eng_saved
       RETURNING *`,
      [title, artist, lyrics, engSaved] // ✅ Ensures eng_saved is FALSE for Melon lyrics
    );
  } finally {
    client.release();
  }

  return lyrics;
}

// ✅ Export the functions
module.exports = { getLyrics, scrapeLyricsFromGenius };
