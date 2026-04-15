require("dotenv").config();
const { createApp, allowedOrigins } = require("./app");

const app = createApp();

if (!process.env.CHROME_PATH) {
  process.env.CHROME_PATH = require("puppeteer").executablePath();
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(", ")}`);
}).on("error", (err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
