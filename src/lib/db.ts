import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { seedDemoData } from './seed';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'vocab.db');

// Use a module-level singleton so Next.js HMR doesn't open a new connection per request.
declare global {
  // eslint-disable-next-line no-var
  var __vocabDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  // Seed only on first run, i.e. when there are no word banks at all.
  const row = db.prepare('SELECT COUNT(*) as c FROM word_banks').get() as { c: number };
  if (row.c === 0) {
    seedDemoData(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS word_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_id INTEGER NOT NULL REFERENCES word_banks(id) ON DELETE CASCADE,
      english_text TEXT NOT NULL,
      correct_hebrew TEXT NOT NULL,
      wrong_hebrew_1 TEXT NOT NULL,
      wrong_hebrew_2 TEXT NOT NULL,
      wrong_hebrew_3 TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_word_items_bank ON word_items(bank_id);

    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bank_id INTEGER NOT NULL REFERENCES word_banks(id),
      state TEXT NOT NULL DEFAULT 'in_progress',
      current_round INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      round_number INTEGER NOT NULL,
      word_item_id INTEGER NOT NULL REFERENCES word_items(id),
      position INTEGER NOT NULL,
      answered_correctly INTEGER,
      answered_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_test_answers_test_round
      ON test_answers(test_id, round_number, position);
  `);
}

export function getDb(): Database.Database {
  if (!global.__vocabDb) {
    global.__vocabDb = createDb();
  }
  return global.__vocabDb;
}

export const DB_FILE_PATH = DB_PATH;
