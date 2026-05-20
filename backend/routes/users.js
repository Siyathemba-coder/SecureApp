const express            = require("express");
const bcrypt             = require("bcryptjs");
const { pool }           = require("../config/db");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All user-management routes require login
router.use(protect);

// ── GET /api/users  (admin only) ─────────────────────────────────
router.get("/", authorize("admin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, username, role, is_active, last_login, created_at
       FROM users
       ORDER BY created_at ASC`
    );
    res.json({ users: rows });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Could not fetch users" });
  }
});

// ── PATCH /api/users/:id/role  (admin only) ──────────────────────
router.patch("/:id/role", authorize("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["viewer", "editor", "admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${validRoles.join(", ")}` });
    }

    // Prevent admin from demoting themselves
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const [result] = await pool.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `Role updated to '${role}'` });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Could not update role" });
  }
});

// ── PATCH /api/users/:id/status  (admin only) ────────────────────
router.patch("/:id/status", authorize("admin"), async (req, res) => {
  try {
    const { is_active } = req.body;

    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "You cannot deactivate yourself" });
    }

    await pool.query("UPDATE users SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, req.params.id]);
    res.json({ message: `User ${is_active ? "activated" : "deactivated"}` });
  } catch (err) {
    res.status(500).json({ message: "Could not update status" });
  }
});

// ── DELETE /api/users/:id  (admin only) ──────────────────────────
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Could not delete user" });
  }
});

// ── GET /api/users/profile  (any logged-in user) ─────────────────
router.get("/profile", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, username, role, is_active, last_login, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Could not fetch profile" });
  }
});

module.exports = router;
