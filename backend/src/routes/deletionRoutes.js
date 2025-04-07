const express = require("express");
const { supabaseAdmin } = require("../config/supabaseAdmin");
const verifySupabaseUser = require("../middlewares/verifySupabaseUser");

const router = express.Router();

// ✅ Delete Own Account
router.post("/delete-user", verifySupabaseUser, async (req, res) => {
  const { userId } = req.body;

  console.log("🔐 Request from:", req.authenticatedUserId);
  console.log("🧍 Requesting deletion of:", userId);

  // ✅ Ensure the user is only deleting their own account
  if (userId !== req.authenticatedUserId) {
    return res
      .status(403)
      .json({ error: "You can only delete your own account" });
  }

  try {
    const { data: user, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res
      .status(500)
      .json({ error: "Failed to delete user", details: error.message });
  }
});

module.exports = router;
