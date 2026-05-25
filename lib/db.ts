import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { demoWords } from "@/data/demoWords";

const dataDir = path.join(process.cwd(), "local_data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "vocabulary.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS word_banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS word_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_bank_id INTEGER NOT NULL,
  english_text TEXT NOT NULL,
  correct_hebrew TEXT NOT NULL,
  wrong_hebrew1 TEXT NOT NULL,
  wrong_hebrew2 TEXT NOT NULL,
  wrong_hebrew3 TEXT NOT NULL,
  FOREIGN KEY(word_bank_id) REFERENCES word_banks(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  word_bank_id INTEGER NOT NULL,
  state TEXT NOT NULL,
  current_index INTEGER NOT NULL DEFAULT 0,
  round_item_ids TEXT NOT NULL,
  latest_mistake_ids TEXT NOT NULL DEFAULT '[]',
  round_correct INTEGER NOT NULL DEFAULT 0,
  round_wrong INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(word_bank_id) REFERENCES word_banks(id) ON DELETE CASCADE
);
`);

const bankCount = db.prepare("SELECT COUNT(*) as count FROM word_banks").get() as { count: number };
if (bankCount.count === 0) {
  const now = new Date().toISOString();
  const bankStmt = db.prepare("INSERT INTO word_banks (name, created_at) VALUES (?, ?)");
  const itemStmt = db.prepare(`INSERT INTO word_items
    (word_bank_id, english_text, correct_hebrew, wrong_hebrew1, wrong_hebrew2, wrong_hebrew3)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const result = bankStmt.run("דמו - מילים בסיסיות", now);
  for (const row of demoWords) {
    itemStmt.run(result.lastInsertRowid, row[0], row[1], row[2], row[3], row[4]);
  }
}
