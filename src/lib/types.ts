export type WordBank = {
  id: number;
  name: string;
  created_at: string;
  item_count?: number;
};

export type WordItem = {
  id: number;
  bank_id: number;
  english_text: string;
  correct_hebrew: string;
  wrong_hebrew_1: string;
  wrong_hebrew_2: string;
  wrong_hebrew_3: string;
};

// A test moves through these states:
//   in_progress -> user is answering the current round's questions
//   result      -> user finished the round, viewing the result screen
//   review      -> user is reviewing the mistakes from the last round
//   completed   -> user answered everything correctly, no more rounds
export type TestState = 'in_progress' | 'result' | 'review' | 'completed';

export type TestSummary = {
  id: number;
  name: string;
  bank_id: number;
  bank_name: string;
  state: TestState;
  current_round: number;
  correct_count: number;
  wrong_count: number;
  remaining_count: number;
  total_in_round: number;
  percent: number | null;
  has_mistakes_to_review: boolean;
};

export type TestAnswerRow = {
  id: number;
  test_id: number;
  round_number: number;
  word_item_id: number;
  position: number;
  answered_correctly: number | null;
  answered_at: string | null;
};

export type RoundQuestion = TestAnswerRow & WordItem;
