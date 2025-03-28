const pool = require("../config/db");

async function getLastGenreIndex() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT last_genre_index FROM cron_state WHERE id = 1");
    return res.rows[0]?.last_genre_index || 0;
  } finally {
    client.release();
  }
}

async function saveGenreIndex(index) {
  const client = await pool.connect();
  try {
    await client.query(
      "UPDATE cron_state SET last_genre_index = $1, updated_at = NOW() WHERE id = 1",
      [index]
    );
  } finally {
    client.release();
  }
}

module.exports = { getLastGenreIndex, saveGenreIndex };
