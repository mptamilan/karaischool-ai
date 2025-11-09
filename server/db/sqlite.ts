import path from "path";
import fs from "fs";

const dbFile = process.env.SESSION_DB_PATH || path.join(process.cwd(), "data", "app.db");
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let usingSqlite = false;
let db: any = null;

try {
  const sqlite3 = require("sqlite3");
  const sqlite = sqlite3.verbose();
  db = new sqlite.Database(dbFile);
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
  usingSqlite = true;
  console.log("SQLite initialized at", dbFile);
} catch (e: any) {
  console.warn("sqlite3 not available, falling back to JSON store", e.message);
}

const jsonFile = path.join(dir, "users.json");
let jsonData: any[] = [];
if (!usingSqlite) {
  try {
    if (fs.existsSync(jsonFile)) {
      jsonData = JSON.parse(fs.readFileSync(jsonFile, "utf8") || "[]");
    }
  } catch (e) {
    jsonData = [];
  }
}

function saveJson() {
  try {
    fs.writeFileSync(jsonFile, JSON.stringify(jsonData, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to save JSON user store", e.message);
  }
}

export async function findOrCreateUserFromGoogle(info: {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}): Promise<any> {
  if (usingSqlite && db) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE google_sub = ? OR email = ?", [info.sub, info.email], (err: any, row: any) => {
        if (err) return reject(err);
        if (row) return resolve(row);
        db.run(
          `INSERT INTO users (google_sub, name, email, picture) VALUES (?,?,?,?)`,
          [info.sub, info.name || null, info.email || null, info.picture || null],
          function (e: any) {
            if (e) return reject(e);
            db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err2: any, newRow: any) => {
              if (err2) return reject(err2);
              resolve(newRow);
            });
          }
        );
      });
    });
  }

  let user = jsonData.find((u) => u.google_sub === info.sub || u.email === info.email);
  if (user) return Promise.resolve(user);
  const id = (jsonData.reduce((m, x) => Math.max(m, x.id || 0), 0) || 0) + 1;
  user = {
    id,
    google_sub: info.sub,
    name: info.name || null,
    email: info.email || null,
    picture: info.picture || null,
    created_at: new Date().toISOString(),
  };
  jsonData.push(user);
  saveJson();
  return Promise.resolve(user);
}

export function getUserById(id: number): Promise<any> {
  if (usingSqlite && db) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE id = ?", [id], (err: any, row: any) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
  const user = jsonData.find((u) => u.id === id);
  return Promise.resolve(user || null);
}

export default db;
