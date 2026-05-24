import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  getCurrentRoundMistakes,
  getNextQuestion,
  getRoundQuestions,
  getTest
} from '@/lib/queries';
import { shuffle } from '@/lib/utils';
import { answerQuestionAction, goToReviewAction } from '@/lib/actions';
import ResultDonut from '@/components/ResultDonut';

export const dynamic = 'force-dynamic';

export default function TestPage({ params }: { params: { testId: string } }) {
  const testId = Number(params.testId);
  if (!Number.isFinite(testId) || testId <= 0) notFound();
  const test = getTest(testId);
  if (!test) notFound();

  if (test.state === 'review') {
    // The review screen is its own URL — bounce there so refresh keeps working.
    redirect(`/tests/${test.id}/review`);
  }

  if (test.state === 'in_progress') {
    return <QuestionScreen test={test} />;
  }
  // 'result' or 'completed' both land on the result screen.
  return <ResultScreen test={test} />;
}

function QuestionScreen({
  test
}: {
  test: NonNullable<ReturnType<typeof getTest>>;
}) {
  const next = getNextQuestion(test.id);
  if (!next) {
    // Defensive: state says in_progress but everything is answered. Show result.
    return <ResultScreen test={test} />;
  }
  const all = getRoundQuestions(test.id, test.current_round);
  const total = all.length;
  const answered = all.filter((q) => q.answered_correctly !== null).length;
  const questionNumber = answered + 1;

  // Randomize the 4 options every time the question is rendered.
  const options = shuffle([
    { text: next.correct_hebrew, isCorrect: true },
    { text: next.wrong_hebrew_1, isCorrect: false },
    { text: next.wrong_hebrew_2, isCorrect: false },
    { text: next.wrong_hebrew_3, isCorrect: false }
  ]);

  return (
    <div>
      <PageHeader title={test.name} subtitle={`מאגר: ${test.bank_name} · סיבוב ${test.current_round}`} />

      <div className="card question-card">
        <div className="question-progress">
          שאלה {questionNumber} מתוך {total}
        </div>
        <div className="english-prompt">{next.english_text}</div>

        <div className="answer-grid">
          {options.map((opt, idx) => (
            <form key={idx} action={answerQuestionAction}>
              <input type="hidden" name="testId" value={test.id} />
              <input type="hidden" name="answerRowId" value={next.id} />
              <input type="hidden" name="isCorrect" value={opt.isCorrect ? '1' : '0'} />
              <button type="submit" className="answer-btn">
                {opt.text}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultScreen({
  test
}: {
  test: NonNullable<ReturnType<typeof getTest>>;
}) {
  const questions = getRoundQuestions(test.id, test.current_round);
  const correct = questions.filter((q) => q.answered_correctly === 1).length;
  const wrong = questions.filter((q) => q.answered_correctly === 0).length;
  const total = correct + wrong;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const mistakes = getCurrentRoundMistakes(test.id);
  const allCorrect = wrong === 0 && total > 0;

  return (
    <div>
      <PageHeader title={`תוצאה - ${test.name}`} subtitle={`סיבוב ${test.current_round}`} />

      <div className="card">
        <div className="result-grid">
          <ResultDonut percent={percent} />
          <div className="result-stats">
            <div className="stat">
              <span className="label">תשובות נכונות</span>
              <span className="value" style={{ color: 'var(--success)' }}>{correct}</span>
            </div>
            <div className="stat">
              <span className="label">טעויות</span>
              <span className="value" style={{ color: 'var(--danger)' }}>{wrong}</span>
            </div>
            <div className="stat">
              <span className="label">סה"כ שאלות בסיבוב</span>
              <span className="value">{total}</span>
            </div>
            <div className="stat">
              <span className="label">אחוז הצלחה</span>
              <span className="value">{percent}%</span>
            </div>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: 24 }}>
          {allCorrect || test.state === 'completed' || mistakes.length === 0 ? (
            <>
              <div className="alert info" style={{ width: '100%', marginBottom: 0 }}>
                סיימת בהצלחה! ענית נכון על כל המילים.
              </div>
            </>
          ) : (
            <form action={goToReviewAction}>
              <input type="hidden" name="testId" value={test.id} />
              <button type="submit" className="btn success">
                חזרה על מילים שטעיתי בהן ({mistakes.length})
              </button>
            </form>
          )}
          <Link href="/" className="btn secondary">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <Link href="/" className="btn secondary">
          חזרה לדף הבית
        </Link>
      </div>
      {subtitle && <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}
