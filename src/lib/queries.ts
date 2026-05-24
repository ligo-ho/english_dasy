import { getDb } from './db';
import { shuffle } from './utils';
import type {
  WordBank,
  WordItem,
  TestSummary,
  TestState,
  RoundQuestion
} from './types';

// ---------- Word banks ----------

export function listWordBanks(): WordBank[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT b.id, b.name, b.created_at,
              (SELECT COUNT(*) FROM word_items i WHERE i.bank_id = b.id) AS item_count
       FROM word_banks b
       ORDER BY b.created_at DESC, b.id DESC`
    )
    .all() as WordBank[];
}

export function getWordBank(id: number): WordBank | undefined {
  const db = getDb();
  return db.prepare('SELECT id, name, created_at FROM word_banks WHERE id = ?').get(id) as
    | WordBank
    | undefined;
}

export function getWordItems(bankId: number): WordItem[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM word_items WHERE bank_id = ? ORDER BY id ASC')
    .all(bankId) as WordItem[];
}

export function createWordBankWithItems(
  name: string,
  items: {
    englishText: string;
    correctHebrew: string;
    wrongHebrew1: string;
    wrongHebrew2: string;
    wrongHebrew3: string;
  }[]
): number {
  const db = getDb();
  const insertBank = db.prepare('INSERT INTO word_banks (name) VALUES (?)');
  const insertItem = db.prepare(`
    INSERT INTO word_items
      (bank_id, english_text, correct_hebrew, wrong_hebrew_1, wrong_hebrew_2, wrong_hebrew_3)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let newId = 0;
  const tx = db.transaction(() => {
    const res = insertBank.run(name);
    newId = Number(res.lastInsertRowid);
    for (const it of items) {
      insertItem.run(
        newId,
        it.englishText,
        it.correctHebrew,
        it.wrongHebrew1,
        it.wrongHebrew2,
        it.wrongHebrew3
      );
    }
  });
  tx();
  return newId;
}

// ---------- Tests ----------

export function listTestSummaries(): TestSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.id, t.name, t.bank_id, t.state, t.current_round, b.name AS bank_name
       FROM tests t JOIN word_banks b ON b.id = t.bank_id
       ORDER BY t.created_at DESC, t.id DESC`
    )
    .all() as {
    id: number;
    name: string;
    bank_id: number;
    state: TestState;
    current_round: number;
    bank_name: string;
  }[];

  return rows.map((r) => {
    const counts = db
      .prepare(
        `SELECT
           SUM(CASE WHEN answered_correctly = 1 THEN 1 ELSE 0 END) AS correct,
           SUM(CASE WHEN answered_correctly = 0 THEN 1 ELSE 0 END) AS wrong,
           SUM(CASE WHEN answered_correctly IS NULL THEN 1 ELSE 0 END) AS remaining,
           COUNT(*) AS total
         FROM test_answers
         WHERE test_id = ? AND round_number = ?`
      )
      .get(r.id, r.current_round) as {
      correct: number | null;
      wrong: number | null;
      remaining: number | null;
      total: number;
    };

    const correct = counts.correct ?? 0;
    const wrong = counts.wrong ?? 0;
    const remaining = counts.remaining ?? 0;
    const total = counts.total ?? 0;
    const answered = correct + wrong;
    const percent = answered > 0 ? Math.round((correct / answered) * 100) : null;

    return {
      id: r.id,
      name: r.name,
      bank_id: r.bank_id,
      bank_name: r.bank_name,
      state: r.state,
      current_round: r.current_round,
      correct_count: correct,
      wrong_count: wrong,
      remaining_count: remaining,
      total_in_round: total,
      percent,
      has_mistakes_to_review: wrong > 0 && (r.state === 'result' || r.state === 'review')
    } satisfies TestSummary;
  });
}

export function getTest(testId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT t.id, t.name, t.bank_id, t.state, t.current_round, b.name AS bank_name
       FROM tests t JOIN word_banks b ON b.id = t.bank_id
       WHERE t.id = ?`
    )
    .get(testId) as
    | {
        id: number;
        name: string;
        bank_id: number;
        state: TestState;
        current_round: number;
        bank_name: string;
      }
    | undefined;
  return row;
}

// Get all rows of the current round, joined with the word item data.
export function getRoundQuestions(testId: number, roundNumber: number): RoundQuestion[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT a.id, a.test_id, a.round_number, a.word_item_id, a.position,
              a.answered_correctly, a.answered_at,
              i.id AS item_id, i.bank_id, i.english_text, i.correct_hebrew,
              i.wrong_hebrew_1, i.wrong_hebrew_2, i.wrong_hebrew_3
       FROM test_answers a
       JOIN word_items i ON i.id = a.word_item_id
       WHERE a.test_id = ? AND a.round_number = ?
       ORDER BY a.position ASC`
    )
    .all(testId, roundNumber)
    .map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        id: r.id as number,
        test_id: r.test_id as number,
        round_number: r.round_number as number,
        word_item_id: r.word_item_id as number,
        position: r.position as number,
        answered_correctly: (r.answered_correctly as number | null) ?? null,
        answered_at: (r.answered_at as string | null) ?? null,
        bank_id: r.bank_id as number,
        english_text: r.english_text as string,
        correct_hebrew: r.correct_hebrew as string,
        wrong_hebrew_1: r.wrong_hebrew_1 as string,
        wrong_hebrew_2: r.wrong_hebrew_2 as string,
        wrong_hebrew_3: r.wrong_hebrew_3 as string
      } as RoundQuestion;
    });
}

// Create a new test, shuffle the source word items, and seed round 1 of test_answers.
export function createTest(name: string, bankId: number): number {
  const db = getDb();
  const items = getWordItems(bankId);
  if (items.length === 0) {
    throw new Error('מאגר המילים ריק. הוסף מילים לפני יצירת מבחן.');
  }

  const insertTest = db.prepare(
    'INSERT INTO tests (name, bank_id, state, current_round) VALUES (?, ?, ?, ?)'
  );
  const insertAnswer = db.prepare(
    'INSERT INTO test_answers (test_id, round_number, word_item_id, position) VALUES (?, ?, ?, ?)'
  );

  let newId = 0;
  const tx = db.transaction(() => {
    const res = insertTest.run(name, bankId, 'in_progress', 1);
    newId = Number(res.lastInsertRowid);
    const shuffled = shuffle(items);
    shuffled.forEach((it, idx) => {
      insertAnswer.run(newId, 1, it.id, idx);
    });
  });
  tx();
  return newId;
}

export function recordAnswer(answerRowId: number, isCorrect: boolean): void {
  const db = getDb();
  db.prepare(
    `UPDATE test_answers
     SET answered_correctly = ?, answered_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(isCorrect ? 1 : 0, answerRowId);
}

export function setTestState(testId: number, state: TestState): void {
  const db = getDb();
  db.prepare('UPDATE tests SET state = ? WHERE id = ?').run(state, testId);
}

// Start a retest round: pick all wrong answers of the current round and create a new round.
// Moves the test back to 'in_progress' on the new round.
export function startRetestRound(testId: number): void {
  const db = getDb();
  const test = getTest(testId);
  if (!test) throw new Error('Test not found');

  const wrongItems = db
    .prepare(
      `SELECT word_item_id FROM test_answers
       WHERE test_id = ? AND round_number = ? AND answered_correctly = 0`
    )
    .all(testId, test.current_round) as { word_item_id: number }[];

  if (wrongItems.length === 0) {
    // Nothing to retest — mark completed.
    setTestState(testId, 'completed');
    return;
  }

  const nextRound = test.current_round + 1;
  const shuffled = shuffle(wrongItems);
  const insertAnswer = db.prepare(
    'INSERT INTO test_answers (test_id, round_number, word_item_id, position) VALUES (?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    shuffled.forEach((w, idx) => {
      insertAnswer.run(testId, nextRound, w.word_item_id, idx);
    });
    db.prepare(
      'UPDATE tests SET state = ?, current_round = ? WHERE id = ?'
    ).run('in_progress', nextRound, testId);
  });
  tx();
}

// Return the wrong items from the current round (used by the review screen).
export function getCurrentRoundMistakes(testId: number): RoundQuestion[] {
  const test = getTest(testId);
  if (!test) return [];
  return getRoundQuestions(test.id, test.current_round).filter(
    (q) => q.answered_correctly === 0
  );
}

// Return the next unanswered question of the current round, or null if none.
export function getNextQuestion(testId: number): RoundQuestion | null {
  const test = getTest(testId);
  if (!test) return null;
  const questions = getRoundQuestions(test.id, test.current_round);
  return questions.find((q) => q.answered_correctly === null) ?? null;
}

export function deleteTest(testId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM tests WHERE id = ?').run(testId);
}
