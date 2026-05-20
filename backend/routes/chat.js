const express    = require("express");
const Groq       = require("groq-sdk");
const { pool }   = require("../config/db");
const { protect } = require("../middleware/auth");

const router = express.Router();
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL  = "llama-3.3-70b-versatile";

// All chat routes require a valid JWT
router.use(protect);

// ── GET /api/chat/history ────────────────────────────────────────
// Returns the last 50 messages for the logged-in user
router.get("/history", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, role, content, model, tokens, created_at
       FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at ASC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error("History fetch error:", err);
    res.status(500).json({ message: "Could not fetch chat history" });
  }
});

// ── POST /api/chat/message ───────────────────────────────────────
// Sends a message to Groq, saves both sides to MySQL, returns reply
router.post("/message", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // 1. Fetch recent conversation history from DB to give Groq context
    const [history] = await pool.query(
      `SELECT role, content
       FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at ASC
       LIMIT 20`,
      [req.user.id]
    );

    // 2. Build the messages array for Groq
    const groqMessages = [
      {
        role: "system",
        content: `You are a helpful AI assistant. The user's name is ${req.user.name} and their role is ${req.user.role}.`,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ];

    // 3. Save the user's message to MySQL
    await pool.query(
      "INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)",
      [req.user.id, message.trim()]
    );

    // 4. Call Groq API (key stays safely on the server)
    const completion = await groq.chat.completions.create({
      model:      MODEL,
      messages:   groqMessages,
      max_tokens: 1024,
    });

    const reply  = completion.choices[0]?.message?.content || "";
    const tokens = completion.usage?.completion_tokens || 0;

    // 5. Save the assistant's reply to MySQL
    await pool.query(
      "INSERT INTO chat_messages (user_id, role, content, tokens) VALUES (?, 'assistant', ?, ?)",
      [req.user.id, reply, tokens]
    );

    res.json({ reply, tokens, model: MODEL });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: err.message || "Chat request failed" });
  }
});

// ── DELETE /api/chat/history ─────────────────────────────────────
// Clears all messages for the logged-in user
router.delete("/history", async (req, res) => {
  try {
    await pool.query("DELETE FROM chat_messages WHERE user_id = ?", [req.user.id]);
    res.json({ message: "Chat history cleared" });
  } catch (err) {
    console.error("Clear history error:", err);
    res.status(500).json({ message: "Could not clear history" });
  }
});

module.exports = router;
