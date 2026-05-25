export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function parsePastedTable(input: string) {
  const lines = input.split(/\r?\n/);
  const parsed: string[][] = [];
  const errors: string[] = [];

  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    const cols = line.split("\t").map((cell) => cell.trim());
    if (cols.length !== 5 || cols.some((cell) => !cell)) {
      errors.push(`שורה ${idx + 1}: נדרשות בדיוק 5 עמודות לא ריקות.`);
      return;
    }
    parsed.push(cols);
  });

  return { parsed, errors };
}
