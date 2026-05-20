const jwt        = require("jsonwebtoken");
const { pool }   = require("../config/db");

// ── Verify JWT and attach user to req ────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized — no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pull a fresh copy from MySQL (catches deleted / deactivated accounts)
    const [rows] = await pool.query(
      "SELECT id, name, username, role, is_active FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ message: "User no longer exists or is deactivated" });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized — invalid or expired token" });
  }
};

// ── Role-based access control ────────────────────────────────────
// Usage: authorize("admin")  or  authorize("editor", "admin")
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied — requires [${roles.join(", ")}]. Your role: ${req.user.role}`,
    });
  }
  next();
};

module.exports = { protect, authorize };
