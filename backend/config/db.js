const mysql = require("mysql2/promise");

// Create a connection pool (reuses connections — much faster than
// opening a new connection for every query)
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "secureapp",
  waitForConnections: true,
  connectionLimit:    10,       // max simultaneous connections
  queueLimit:         0,        // unlimited queue
  timezone:           "Z",      // store dates as UTC
});

// Test the connection and export the pool
const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected: ${process.env.DB_HOST}:${process.env.DB_PORT} → ${process.env.DB_NAME}`);
    conn.release();
  } catch (err) {
    console.error(`❌ MySQL connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
