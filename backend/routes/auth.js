const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { pool } = require("../config/db");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ── Helper: sign a JWT ───────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ── POST /api/auth/signup ────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Basic validation
    if (!name || !username || !password) {
      return res.status(400).json({ message: "Name, username, and password are required" });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!/^[a-z0-9_]+$/i.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    // Check for duplicate username
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username.toLowerCase()]
    );
    if (existing.length) {
      return res.status(409).json({ message: "Username is already taken" });
    }

    // Hash the password with bcrypt (12 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user — role defaults to 'viewer' in the DB
    const [result] = await pool.query(
      "INSERT INTO users (name, username, password) VALUES (?, ?, ?)",
      [name.trim(), username.toLowerCase(), hashedPassword]
    );

    const newUser = { id: result.insertId, name: name.trim(), username: username.toLowerCase(), role: "viewer" };
    const token   = signToken(newUser);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: newUser,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Fetch user including the hashed password
    const [rows] = await pool.query(
      "SELECT id, name, username, password, role, is_active FROM users WHERE username = ?",
      [username.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // Compare entered password with the bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Update last_login timestamp
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    const safeUser = { id: user.id, name: user.name, username: user.username, role: user.role };
    const token    = signToken(safeUser);

    res.json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ── GET /api/auth/me  (protected) ───────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
