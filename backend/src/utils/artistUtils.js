const aromanize = require("aromanize");
const artistTranslationMap = require("./artistTranslations");

/**
 * ✅ Process artist and title for better search results.
 * @param {string} artist - Artist name from the database.
 * @param {string} title - Song title from the database.
 * @returns {Object} - Processed artist and title.
 */
function processArtistAndTitle(artist, title) {
  let processedArtist = artist;

  // ✅ Use predefined translation if available
  if (artistTranslationMap[artist]) {
    processedArtist = artistTranslationMap[artist];
    console.log(`🔠 Using mapped artist name: ${artist} → ${processedArtist}`);
  }
  // ✅ Romanize if artist name is fully Korean and not in the map
  else if (/^[\uac00-\ud7a3\s]+$/.test(artist)) {
    processedArtist = artist.romanize() + " " + artist;
    console.log(`🔠 Romanized artist name: ${artist} → ${processedArtist}`);
  }

  // ✅ Remove "(feat. ...)" from the title
  let processedTitle = title.replace(/\s*\(feat[^\)]+\)/gi, "").trim();

  return { processedArtist, processedTitle };
}

module.exports = { processArtistAndTitle };
