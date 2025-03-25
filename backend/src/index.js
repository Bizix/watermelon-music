require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const pool = require("./config/db");
const scraperRoutes = require("./routes/scraperRoutes");
const rankingsRoutes = require("./routes/rankingsRoutes");
const youtubeRoutes = require("./routes/youtubeRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
const deletionRoutes = require ("./routes/deletionRoutes.js"); 
const playlistRoutes = require("./routes/playlistRoutes");

const app = express();

const allowedOrigins = [
  'https://watermelon-music.vercel.app',
  'http://localhost:5173'
];

// ✅ Middleware
app.use(express.json());
app.use(helmet()); // ✅ Security headers
app.use(morgan("dev")); // ✅ Request logging

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// ✅ API Routes
app.use("/api", scraperRoutes);
app.use("/api", rankingsRoutes);
app.use("/api", youtubeRoutes);
app.use("/api", deletionRoutes);
app.use("/api/lyrics", lyricsRoutes); 
app.use("/api/playlistRoutes", playlistRoutes);

if (!process.env.CHROME_PATH) {
  process.env.CHROME_PATH = require('puppeteer').executablePath();
}

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.send("✅ Melon Music App API is running!");
});

// ✅ Database Connection Test
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time;");
    res.json({ success: true, db_time: result.rows[0].current_time });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
