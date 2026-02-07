import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "probio.sqlite");

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath);

export function initializeDatabase() {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS profiles (
        user_id INTEGER PRIMARY KEY,
        username TEXT UNIQUE,
        name TEXT,
        profession TEXT,
        bio TEXT,
        photo_url TEXT,
        whatsapp_number TEXT,
        whatsapp_message TEXT,
        whatsapp_enabled INTEGER DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS portfolio_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        image_url TEXT,
        link_url TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`
    );
  });
}
