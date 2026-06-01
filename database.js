import Database from 'better-sqlite3';
const db = new Database('CLOCKINCLOCKOUT.db');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ── Create users table ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    UNIQUE NOT NULL,
    password     TEXT    NOT NULL,
    role         TEXT    NOT NULL DEFAULT 'teacher',  -- 'teacher' or 'admin'
    department   TEXT,
    created_at   TEXT    DEFAULT (datetime('now'))
  );
`);

// ── Create clock_records table ────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS clock_records (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    clock_in   TEXT,
    clock_out  TEXT,
    date       TEXT    DEFAULT (date('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

export default db;
