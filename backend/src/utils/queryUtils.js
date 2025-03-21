const artistTranslationMap = require("./artistTranslations");
const aromanize = require("aromanize");

// Last name overrides for common Korean surnames.
const lastNameOverrides = {
  이: "Lee",
  박: "Park",
  김: "Kim",
  강: "Kang",
  최: "Choi",
};

function generateSearchQueries(artist, title, album) {
  // Clean title by removing any "(feat. ...)" text
  const cleanTitle = title.replace(/\s*\(feat[^\)]+\)/gi, "").trim();

  let queries = [];
  // 1. Use translation map if available
  if (artistTranslationMap[artist]) {
    const mappedArtist = artistTranslationMap[artist];
    let query = `track:"${cleanTitle}" artist:"${mappedArtist}"`;
    if (album) query += ` album:"${album}"`;
    queries.push(query);
  }

  // 2. If artist is in Hangul, try Hangul-only queries
  if (/^[\uac00-\ud7a3\s]+$/.test(artist)) {

    let query = `track:"${cleanTitle}" artist:"${artist}"`;
    if (album) query += ` album:"${album}"`;
    queries.push(query);

    // 3. Try a romanized version of the artist name
    let romanizedArtist = artist.romanize();
    // Apply last name override if applicable
    const firstChar = artist[0];
    if (lastNameOverrides[firstChar]) {
      romanizedArtist = lastNameOverrides[firstChar] + " " + romanizedArtist.slice(1);
    }
    query = `track:"${cleanTitle}" artist:"${romanizedArtist}"`;
    if (album) query += ` album:"${album}"`;
    queries.push(query);
  } else {
    // 4. Fallback: use the artist as-is.
    let query = `track:"${cleanTitle}" artist:"${artist}"`;
    if (album) query += ` album:"${album}"`;
    queries.push(query);
  }

  // Last resort: Try raw arist name + song title
  let query = `${cleanTitle} ${artist}`;
  queries.push(query);

  // Optionally, you can log all generated queries for debugging:
  console.log("Generated Query Variants:", queries);
  return queries;
}

module.exports = { generateSearchQueries };
