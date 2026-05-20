require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");
const { connectDB } = require("./config/db");

// ── Route imports ────────────────────────────────────────────────
const authRoutes  = require("./routes/auth");
const chatRoutes  = require("./routes/chat");
const userRoutes  = require("./routes/users");

const app = express();

// ── Connect to MySQL ─────────────────────────────────────────────
connectDB();

// ── Global Middleware ────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));  // parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting (prevent brute force on auth routes) ───────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      20,               // max 20 auth attempts per window
  message:  { message: "Too many requests, please try again later." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      30,         // 30 chat messages per minute (matches Groq free tier)
  message:  { message: "Chat rate limit reached. Wait a moment." },
});

// ── Routes ───────────────────────────────────────────────────────
app.use("/api/auth",  authLimiter, authRoutes);
app.use("/api/chat",  chatLimiter, chatRoutes);
app.use("/api/users", userRoutes);

// ── Health check ─────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// ── Start server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Auth:    http://localhost:${PORT}/api/auth`);
  console.log(`   Chat:    http://localhost:${PORT}/api/chat`);
  console.log(`   Users:   http://localhost:${PORT}/api/users`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
});
