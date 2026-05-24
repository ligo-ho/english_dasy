export type ParsedRow = {
  englishText: string;
  correctHebrew: string;
  wrongHebrew1: string;
  wrongHebrew2: string;
  wrongHebrew3: string;
};

export type ParseResult = {
  rows: ParsedRow[];
  errors: string[];
};

// Parse pasted spreadsheet content. Columns are tab-separated, rows are newline-separated.
// Empty rows are skipped. Each non-empty row must have exactly 5 columns.
export function parseTablePaste(raw: string): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === '') return; // skip empty rows
    // Split on tab; if no tabs at all, also try 2+ spaces as a fallback (some pastes mangle tabs).
    let cols = line.split('\t');
    if (cols.length < 2) {
      cols = line.split(/\s{2,}|\s*\|\s*/);
    }
    cols = cols.map((c) => c.trim());
    if (cols.length !== 5 || cols.some((c) => c === '')) {
      errors.push(`שורה ${idx + 1}: יש להזין בדיוק 5 עמודות לא ריקות (אנגלית, תרגום נכון, 3 תרגומים שגויים).`);
      return;
    }
    rows.push({
      englishText: cols[0],
      correctHebrew: cols[1],
      wrongHebrew1: cols[2],
      wrongHebrew2: cols[3],
      wrongHebrew3: cols[4]
    });
  });

  return { rows, errors };
}

// Fisher–Yates shuffle, non-mutating.
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
