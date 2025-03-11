/**
 * ✅ Search Google & Scrape Genius Lyrics
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<string|null>} - Scraped lyrics or null
 */
async function scrapeGeniusLyrics(title, artist) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    try {
      // ✅ Set a random user-agent to avoid bot detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      );
  
      const searchQuery = `${title} ${artist} Genius English Translation`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  
      console.log(`🔎 Searching Google: ${searchQuery}`);
      await page.goto(googleSearchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  
      // ✅ Extract links from search results
      const links = await page.$$eval("a", (anchors) =>
        anchors.map((a) => ({ href: a.href, text: a.innerText }))
      );
  
      // ✅ Only select Genius links that explicitly mention "English Translation"
      const geniusLink = links.find(
        (link) => link.href.includes("genius.com") && link.text.toLowerCase().includes("english translation")
      );
  
      if (!geniusLink) {
        console.warn(`⚠️ No Genius English Translation found for: ${title} - ${artist}`);
        console.warn(`🔄 Attempting alternative lyrics fetching method...`);
        return null; // ✅ Return null to trigger an alternative lyrics search
      }
  
      console.log(`🔗 Found Genius page: ${geniusLink.href}`);
      await page.goto(geniusLink.href, { waitUntil: "domcontentloaded", timeout: 30000 });
  
      // ✅ Scrape lyrics from the correct element
      const lyrics = await page.$$eval("[data-lyrics-container]", (containers) =>
        containers.map((c) => c.innerText).join("\n")
      );
  
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
      await browser.close(); // ✅ Ensure browser always closes
    }
  }
  