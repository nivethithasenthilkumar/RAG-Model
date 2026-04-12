/**
 * SQLite Database Configuration
 * Stores users, documents metadata, and search history
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'documind.db');
const db = new Database(DB_PATH);

// For demos, use 'DELETE' mode to force immediate disk syncing 
// so the user sees data in their browser immediately.
db.pragma('journal_mode = DELETE');
db.pragma('foreign_keys = ON');

// ── Create Tables ─────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT,
    full_name   TEXT NOT NULL,
    organization TEXT,
    profile_pic TEXT,
    provider    TEXT DEFAULT 'local',
    provider_id TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    file_name     TEXT NOT NULL,
    file_type     TEXT NOT NULL,
    file_size     INTEGER,
    file_path     TEXT,
    total_chunks  INTEGER DEFAULT 0,
    total_tokens  INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'processing',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    query             TEXT NOT NULL,
    results_count     INTEGER DEFAULT 0,
    average_similarity REAL,
    execution_time    INTEGER,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS login_history (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    ip_address  TEXT,
    user_agent  TEXT,
    logged_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('--------------------------------------------------');
console.log('✅ DATABASE ACTIVE');
console.log('📍 PATH:', DB_PATH);
console.log('--------------------------------------------------');

module.exports = db;
