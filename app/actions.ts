"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parsePastedTable, shuffle } from "@/lib/utils";

export async function createBankAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const content = String(formData.get("content") || "");
  if (!name) return { error: "יש להזין שם למאגר." };

  const { parsed, errors } = parsePastedTable(content);
  if (errors.length) return { error: errors.join(" ") };
  if (parsed.length === 0) return { error: "לא נמצאו שורות תקינות לשמירה." };

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const bank = db.prepare("INSERT INTO word_banks (name, created_at) VALUES (?, ?)").run(name, now);
    const stmt = db.prepare(`INSERT INTO word_items
      (word_bank_id, english_text, correct_hebrew, wrong_hebrew1, wrong_hebrew2, wrong_hebrew3)
      VALUES (?, ?, ?, ?, ?, ?)`);
    for (const row of parsed) stmt.run(bank.lastInsertRowid, row[0], row[1], row[2], row[3], row[4]);
  });
  tx();
  revalidatePath("/");
  redirect("/");
}

export async function createTestAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const bankId = Number(formData.get("bankId"));
  if (!name || !bankId) return { error: "נא לבחור מאגר ולתת שם למבחן." };

  const items = db.prepare("SELECT id FROM word_items WHERE word_bank_id = ?").all(bankId) as { id: number }[];
  if (!items.length) return { error: "המאגר שנבחר ריק." };

  const roundIds = shuffle(items.map((i) => i.id));
  const now = new Date().toISOString();
  const result = db.prepare(`INSERT INTO tests
    (name, word_bank_id, state, current_index, round_item_ids, latest_mistake_ids, round_correct, round_wrong, created_at, updated_at)
    VALUES (?, ?, 'in_progress', 0, ?, '[]', 0, 0, ?, ?)`).run(name, bankId, JSON.stringify(roundIds), now, now);

  revalidatePath("/");
  redirect(`/tests/${result.lastInsertRowid}`);
}

export async function answerQuestionAction(testId: number, selected: string) {
  const test = db.prepare("SELECT * FROM tests WHERE id = ?").get(testId) as any;
  const roundIds: number[] = JSON.parse(test.round_item_ids);
  const mistakes: number[] = JSON.parse(test.latest_mistake_ids);
  const itemId = roundIds[test.current_index];
  const item = db.prepare("SELECT * FROM word_items WHERE id = ?").get(itemId) as any;

  const isCorrect = selected === item.correct_hebrew;
  const newMistakes = isCorrect ? mistakes : [...mistakes, itemId];
  const nextIndex = test.current_index + 1;
  const state = nextIndex >= roundIds.length ? (newMistakes.length ? "round_results" : "completed") : "in_progress";

  db.prepare(`UPDATE tests SET current_index=?, latest_mistake_ids=?, round_correct=?, round_wrong=?, state=?, updated_at=? WHERE id=?`).run(
    nextIndex,
    JSON.stringify(newMistakes),
    test.round_correct + (isCorrect ? 1 : 0),
    test.round_wrong + (isCorrect ? 0 : 1),
    state,
    new Date().toISOString(),
    testId
  );
  revalidatePath(`/tests/${testId}`);
}

export async function moveToReviewAction(testId: number) {
  db.prepare("UPDATE tests SET state='review', updated_at=? WHERE id=?").run(new Date().toISOString(), testId);
  redirect(`/tests/${testId}/review`);
}

export async function startRetestAction(testId: number) {
  const test = db.prepare("SELECT latest_mistake_ids FROM tests WHERE id=?").get(testId) as any;
  const mistakes: number[] = JSON.parse(test.latest_mistake_ids);
  const newOrder = shuffle(mistakes);
  db.prepare(`UPDATE tests SET state='in_progress', current_index=0, round_item_ids=?, latest_mistake_ids='[]', round_correct=0, round_wrong=0, updated_at=? WHERE id=?`).run(
    JSON.stringify(newOrder),
    new Date().toISOString(),
    testId
  );
  redirect(`/tests/${testId}`);
}
