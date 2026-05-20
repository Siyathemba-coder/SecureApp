-- ============================================================
--  SecureApp — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS secureapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE secureapp;

-- ── Users table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  username    VARCHAR(30)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,               -- bcrypt hash
  role        ENUM('viewer','editor','admin')
              NOT NULL DEFAULT 'viewer',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  last_login  DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
              ON UPDATE CURRENT_TIMESTAMP
);

-- ── Chat messages table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          UNSIGNED NOT NULL,
  role        ENUM('user','assistant') NOT NULL,
  content     TEXT         NOT NULL,
  model       VARCHAR(80)  NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  tokens      INT          UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE          -- deleting a user removes their messages too
);

-- Index for fast per-user chat history lookups
CREATE INDEX idx_chat_user_id ON chat_messages(user_id);

-- ── Seed: default admin account ──────────────────────────────────
-- Password: Admin@123  (bcrypt hash — change after first login!)
INSERT IGNORE INTO users (name, username, password, role) VALUES
  ('Admin User',   'admin',  '$2a$12$XUqhyVyIWBnsFqNGk2V/5.JhtRtBzLnMCNPMCLVBHzizFkS6PVMKK', 'admin'),
  ('Editor User',  'editor', '$2a$12$Gb0ZWNxNTjJjqKKYhVRireQBnWzAyGAanV8pJGIPi.N9EMq5UqaEe', 'editor'),
  ('Viewer User',  'viewer', '$2a$12$UwMc1y1x2lAhgZeqJmfQEOipkdhnHKN.ZRZEZt8H0OfD1mREPZiN2', 'viewer');

-- ── Verify everything was created ────────────────────────────────
SELECT 'Tables created successfully' AS status;
SHOW TABLES;
SELECT id, name, username, role FROM users;
