import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { User } from "@shared/api";

// Vercel has a writable /tmp directory. All other paths are read-only.
const dbFile = process.env.SESSION_DB_PATH || "/tmp/app.db";
const dir = path.dirname(dbFile);
// This check is important for local dev but will work on Vercel too.
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new (sqlite3.verbose().Database)(dbFile);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_sub TEXT UNIQUE,
    name TEXT,
    email TEXT,
    picture TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});

export async function findOrCreateUserFromGoogle(info: {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}): Promise<User> {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE google_sub = ? OR email = ?", [info.sub, info.email], (err, row: User) => {
      if (err) return reject(err);
      if (row) return resolve(row);
      db.run(
        `INSERT INTO users (google_sub, name, email, picture) VALUES (?,?,?,?)`,
        [info.sub, info.name || null, info.email || null, info.picture || null],
        function (this: sqlite3.RunResult, e: Error | null) {
          if (e) return reject(e);
          db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err2, newRow: User) => {
            if (err2) return reject(err2);
            resolve(newRow);
          });
        }
      );
    });
  });
}

export function getUserById(id: number): Promise<User | null> {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row: User) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

export default db;
