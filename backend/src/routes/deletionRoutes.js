const express = require("express");
const { supabaseAdmin } = require("../config/supabaseAdmin");

const router = express.Router();

// ✅ Delete User Account
router.post("/delete-user", async (req, res) => {
    const { userId } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
  
    try {
      console.log("Looking up user with ID:", userId);
  
      // ✅ Check if user exists before attempting deletion
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  
      if (userError || !user) {
        console.error("User not found:", userError);
        return res.status(404).json({ error: "User not found" });
      }
  
      console.log("Deleting user:", userId);
  
      // ✅ Attempt to delete user
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
  
      res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error.stack || error.message);
      res.status(500).json({ error: "Failed to delete user", details: error.message });
    }
  });

module.exports = router;
