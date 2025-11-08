import path from "path";
import Database from "sqlite3";

const dbFile =
  process.env.SESSION_DB_PATH || path.join(process.cwd(), "data", "app.db");

// Ensure folder exists
import fs from "fs";
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = Database.verbose();
const db = new sqlite.Database(dbFile);

// Initialize users table
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

export function findOrCreateUserFromGoogle(info: {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}) {
  return new Promise<any>((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE google_sub = ?",
      [info.sub],
      (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(row);
        db.run(
          `INSERT INTO users (google_sub, name, email, picture) VALUES (?,?,?,?)`,
          [
            info.sub,
            info.name || null,
            info.email || null,
            info.picture || null,
          ],
          function (e) {
            if (e) return reject(e);
            db.get(
              "SELECT * FROM users WHERE id = ?",
              [this.lastID],
              (err2, newRow) => {
                if (err2) return reject(err2);
                resolve(newRow);
              },
            );
          },
        );
      },
    );
  });
}

export function getUserById(id: number) {
  return new Promise<any>((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export default db;
