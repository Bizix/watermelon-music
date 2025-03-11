const aromanize = require("aromanize");
const artistTranslationMap = require("./artistTranslations");

/**
 * ✅ Custom last-name mapping for common Korean surnames.
 */
const lastNameOverrides = {
  이: "Lee",
  박: "Park",
  김: "Kim",
  강: "Kang",
  최: "Choi",
};

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
    let originalKorean = artist;

    // ✅ If exactly 3 Korean characters, add a space after the first character in the English version
    let romanizedArtist = artist.romanize();
    if (artist.length === 3) {
      romanizedArtist = romanizedArtist[0] + romanizedArtist.slice(1);
    }

    // ✅ Check for last name overrides
    const firstChar = originalKorean[0];
    if (lastNameOverrides[firstChar]) {
      romanizedArtist =
        lastNameOverrides[firstChar] + " " + romanizedArtist.slice(1);
    }

    processedArtist = romanizedArtist + " " + originalKorean;
    console.log(
      `🔠 Romanized artist name: ${originalKorean} → ${processedArtist}`
    );
  }

  // ✅ Remove "(feat. ...)" from the title
  let processedTitle = title.replace(/\s*\(feat[^\)]+\)/gi, "").trim();

  return { processedArtist, processedTitle };
}

module.exports = { processArtistAndTitle };
