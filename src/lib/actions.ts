'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createTest,
  createWordBankWithItems,
  deleteTest,
  getNextQuestion,
  getTest,
  recordAnswer,
  setTestState,
  startRetestRound
} from './queries';
import { parseTablePaste } from './utils';

export async function createBankAction(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const raw = String(formData.get('rows') ?? '');
  if (!name) throw new Error('יש להזין שם למאגר.');
  const parsed = parseTablePaste(raw);
  if (parsed.errors.length > 0) {
    // The page form does its own client-side preview & validation, but guard server-side too.
    throw new Error('נמצאו שגיאות בנתונים שהודבקו:\n' + parsed.errors.join('\n'));
  }
  if (parsed.rows.length === 0) {
    throw new Error('לא נמצאו שורות תקינות להוספה.');
  }
  createWordBankWithItems(name, parsed.rows);
  revalidatePath('/');
  redirect('/');
}

export async function createTestAction(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const bankId = Number(formData.get('bankId'));
  if (!name) throw new Error('יש להזין שם למבחן.');
  if (!Number.isFinite(bankId) || bankId <= 0) throw new Error('יש לבחור מאגר מילים.');
  const testId = createTest(name, bankId);
  revalidatePath('/');
  redirect(`/tests/${testId}`);
}

export async function answerQuestionAction(formData: FormData): Promise<void> {
  const answerRowId = Number(formData.get('answerRowId'));
  const isCorrect = String(formData.get('isCorrect')) === '1';
  const testId = Number(formData.get('testId'));
  if (!Number.isFinite(answerRowId) || !Number.isFinite(testId)) {
    throw new Error('Invalid form data.');
  }
  recordAnswer(answerRowId, isCorrect);

  // If there are no more unanswered questions, advance the test to the result state.
  if (!getNextQuestion(testId)) {
    setTestState(testId, 'result');
  }
  revalidatePath(`/tests/${testId}`);
  revalidatePath('/');
}

export async function goToReviewAction(formData: FormData): Promise<void> {
  const testId = Number(formData.get('testId'));
  const test = getTest(testId);
  if (!test) throw new Error('Test not found');
  setTestState(testId, 'review');
  revalidatePath(`/tests/${testId}`);
  revalidatePath('/');
  redirect(`/tests/${testId}/review`);
}

export async function startRetestAction(formData: FormData): Promise<void> {
  const testId = Number(formData.get('testId'));
  startRetestRound(testId);
  revalidatePath(`/tests/${testId}`);
  revalidatePath('/');
  redirect(`/tests/${testId}`);
}

export async function deleteTestAction(formData: FormData): Promise<void> {
  const testId = Number(formData.get('testId'));
  if (Number.isFinite(testId) && testId > 0) {
    deleteTest(testId);
  }
  revalidatePath('/');
}
