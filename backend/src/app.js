require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const pool = require("./config/db");
const scraperRoutes = require("./routes/scraperRoutes");
const rankingsRoutes = require("./routes/rankingsRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
const deletionRoutes = require("./routes/deletionRoutes.js");
const cronRoutes = require("./routes/cronRoutes");
const spotifyRoutes = require("./routes/spotifyRoutes");

const allowedOrigins = [
  "https://watermelon-music.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(helmet());
  app.use(morgan("dev"));

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (!allowedOrigins.includes(origin)) {
          return callback(
            new Error(
              "The CORS policy for this site does not allow access from the specified Origin."
            ),
            false
          );
        }

        return callback(null, true);
      },
      credentials: true,
    })
  );

  app.use("/api", cronRoutes);
  app.use("/api", scraperRoutes);
  app.use("/api", rankingsRoutes);
  app.use("/api", deletionRoutes);
  app.use("/api/lyrics", lyricsRoutes);
  app.use("/api/spotify", spotifyRoutes);

  app.get("/", (_req, res) => {
    res.send("✅ Melon Music App API is running!");
  });

  app.get("/test-db", async (_req, res) => {
    try {
      const result = await pool.query("SELECT NOW() AS current_time;");
      res.json({ success: true, db_time: result.rows[0].current_time });
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.use((err, _req, res, _next) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  });

  return app;
}

module.exports = { createApp, allowedOrigins };
