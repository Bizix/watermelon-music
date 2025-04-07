const jwt = require("jsonwebtoken");

function verifySupabaseUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.payload || !decoded.payload.sub) {
      console.warn("❌ Invalid or malformed token:", token);
      return res.status(403).json({ error: "Invalid token" });
    }

    req.authenticatedUserId = decoded.payload.sub;
    next();
  } catch (error) {
    console.error("❌ Token decoding failed:", error);
    return res.status(403).json({ error: "Token verification failed" });
  }
}

module.exports = verifySupabaseUser;
