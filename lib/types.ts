export type TestState = "in_progress" | "round_results" | "review" | "completed";

export type WordItem = {
  id: number;
  wordBankId: number;
  englishText: string;
  correctHebrew: string;
  wrongHebrew1: string;
  wrongHebrew2: string;
  wrongHebrew3: string;
};
