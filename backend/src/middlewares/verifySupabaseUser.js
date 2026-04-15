const { supabaseAdmin } = require("../config/supabaseAdmin");

async function verifySupabaseUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user?.id) {
      console.warn("❌ Invalid Supabase token:", error?.message || "Unknown auth error");
      return res.status(403).json({ error: "Invalid token" });
    }

    req.authenticatedUserId = user.id;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(403).json({ error: "Token verification failed" });
  }
}

module.exports = verifySupabaseUser;
