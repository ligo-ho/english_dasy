import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentRoundMistakes, getTest } from '@/lib/queries';
import { startRetestAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default function ReviewPage({ params }: { params: { testId: string } }) {
  const testId = Number(params.testId);
  if (!Number.isFinite(testId) || testId <= 0) notFound();
  const test = getTest(testId);
  if (!test) notFound();

  const mistakes = getCurrentRoundMistakes(test.id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0 }}>חזרה על מילים שטעיתי בהן</h1>
          <div className="muted" style={{ marginTop: 4 }}>
            {test.name} · סיבוב {test.current_round}
          </div>
        </div>
        <Link href="/" className="btn secondary">
          חזרה לדף הבית
        </Link>
      </div>

      {mistakes.length === 0 ? (
        <div className="alert info">
          אין מילים לחזרה מהסיבוב האחרון. <Link href={`/tests/${test.id}`}>חזור למסך התוצאה</Link>.
        </div>
      ) : (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            לפניך {mistakes.length} מילים מהסיבוב האחרון. למד אותן ולחץ על "התחל מבחן חוזר".
          </p>
          <div className="review-list">
            {mistakes.map((m) => (
              <div className="review-row" key={m.id}>
                <span className="eng">{m.english_text}</span>
                <span>{m.correct_hebrew}</span>
              </div>
            ))}
          </div>

          <div className="btn-row" style={{ marginTop: 24 }}>
            <form action={startRetestAction}>
              <input type="hidden" name="testId" value={test.id} />
              <button type="submit" className="btn success">
                התחל מבחן חוזר
              </button>
            </form>
            <Link href="/" className="btn secondary">
              ביטול
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
