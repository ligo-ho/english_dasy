import type Database from 'better-sqlite3';

// Seed/demo vocabulary used on first run, so the app has something to play with.
// Structure matches the required source-table layout:
//   English | Correct Hebrew | Wrong 1 | Wrong 2 | Wrong 3
const DEMO_BANKS: { name: string; rows: [string, string, string, string, string][] }[] = [
  {
    name: 'מאגר הדגמה - מילים בסיסיות',
    rows: [
      ['apple', 'תפוח', 'אגס', 'בננה', 'תפוז'],
      ['book', 'ספר', 'מחברת', 'עיפרון', 'עט'],
      ['house', 'בית', 'דירה', 'חדר', 'גג'],
      ['car', 'מכונית', 'אופניים', 'אוטובוס', 'רכבת'],
      ['water', 'מים', 'יין', 'חלב', 'מיץ'],
      ['friend', 'חבר', 'אויב', 'שכן', 'אורח'],
      ['school', 'בית ספר', 'גן ילדים', 'אוניברסיטה', 'מעבדה'],
      ['teacher', 'מורה', 'תלמיד', 'מנהל', 'הורה'],
      ['happy', 'שמח', 'עצוב', 'כועס', 'מפוחד'],
      ['fast', 'מהיר', 'איטי', 'חזק', 'חלש'],
      ['day', 'יום', 'לילה', 'שבוע', 'חודש'],
      ['city', 'עיר', 'כפר', 'מדינה', 'יבשת']
    ]
  },
  {
    name: 'מאגר הדגמה - פעלים נפוצים',
    rows: [
      ['to run', 'לרוץ', 'ללכת', 'לקפוץ', 'לשחות'],
      ['to eat', 'לאכול', 'לשתות', 'לבשל', 'לטעום'],
      ['to write', 'לכתוב', 'לקרוא', 'לצייר', 'למחוק'],
      ['to sleep', 'לישון', 'להתעורר', 'לחלום', 'לנוח'],
      ['to learn', 'ללמוד', 'ללמד', 'לזכור', 'לשכוח'],
      ['to buy', 'לקנות', 'למכור', 'לשלם', 'להחזיר'],
      ['to give', 'לתת', 'לקבל', 'לשלוח', 'לקחת'],
      ['to open', 'לפתוח', 'לסגור', 'לנעול', 'לשבור']
    ]
  }
];

export function seedDemoData(db: Database.Database): void {
  const insertBank = db.prepare('INSERT INTO word_banks (name) VALUES (?)');
  const insertItem = db.prepare(`
    INSERT INTO word_items (bank_id, english_text, correct_hebrew, wrong_hebrew_1, wrong_hebrew_2, wrong_hebrew_3)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const bank of DEMO_BANKS) {
      const res = insertBank.run(bank.name);
      const bankId = Number(res.lastInsertRowid);
      for (const row of bank.rows) {
        insertItem.run(bankId, row[0], row[1], row[2], row[3], row[4]);
      }
    }
  });
  tx();
}
