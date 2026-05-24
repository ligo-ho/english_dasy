import Link from 'next/link';
import { listTestSummaries, listWordBanks } from '@/lib/queries';
import { deleteTestAction } from '@/lib/actions';
import type { TestSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

const STATE_LABEL: Record<TestSummary['state'], string> = {
  in_progress: 'בתהליך',
  result: 'מסך תוצאות',
  review: 'חזרה על טעויות',
  completed: 'הושלם'
};

export default function HomePage() {
  const tests = listTestSummaries();
  const banks = listWordBanks();

  return (
    <div>
      <h1>דף הבית</h1>
      <p className="muted">צור מאגרי מילים, פתח מבחנים חדשים והמשך מבחנים פעילים.</p>

      <div className="dashboard-actions">
        <Link href="/banks/new" className="btn">
          + יצירת מאגר חדש
        </Link>
        <Link href="/tests/new" className="btn secondary">
          + יצירת מבחן חדש
        </Link>
      </div>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2>מאגרי מילים ({banks.length})</h2>
        {banks.length === 0 ? (
          <p className="muted">אין עדיין מאגרי מילים. צור מאגר חדש כדי להתחיל.</p>
        ) : (
          <ul style={{ paddingInlineStart: 18, margin: 0 }}>
            {banks.map((b) => (
              <li key={b.id} style={{ marginBottom: 4 }}>
                {b.name} <span className="muted">— {b.item_count ?? 0} מילים</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>מבחנים ({tests.length})</h2>
        {tests.length === 0 ? (
          <p className="muted">אין עדיין מבחנים. לחץ על "יצירת מבחן חדש" כדי להתחיל.</p>
        ) : (
          <div className="test-list">
            {tests.map((t) => (
              <TestCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TestCard({ t }: { t: TestSummary }) {
  const continueLabel =
    t.state === 'completed'
      ? 'הצג מבחן'
      : t.state === 'review'
        ? 'חזרה על מילים שטעיתי בהן'
        : t.state === 'result'
          ? 'הצג תוצאה'
          : t.correct_count + t.wrong_count === 0
            ? 'התחל מבחן'
            : 'המשך מבחן';

  const continueHref =
    t.state === 'review' ? `/tests/${t.id}/review` : `/tests/${t.id}`;

  return (
    <div className="card">
      <div className="test-card-head">
        <div>
          <h3>{t.name}</h3>
          <div className="muted" style={{ fontSize: 14 }}>
            מאגר: {t.bank_name} · סיבוב {t.current_round}
          </div>
        </div>
        <span className={`badge ${t.state}`}>{STATE_LABEL[t.state]}</span>
      </div>

      <div className="test-meta">
        <div>
          <strong>תשובות נכונות</strong>
          {t.correct_count}
        </div>
        <div>
          <strong>טעויות</strong>
          {t.wrong_count}
        </div>
        <div>
          <strong>נשארו בסיבוב</strong>
          {t.remaining_count} / {t.total_in_round}
        </div>
        <div>
          <strong>אחוז הצלחה</strong>
          {t.percent === null ? '—' : `${t.percent}%`}
        </div>
        <div>
          <strong>מילים לחזרה</strong>
          {t.has_mistakes_to_review ? `כן (${t.wrong_count})` : 'לא'}
        </div>
      </div>

      <div className="btn-row">
        <Link href={continueHref} className="btn">
          {continueLabel}
        </Link>
        <form action={deleteTestAction} className="inline">
          <input type="hidden" name="testId" value={t.id} />
          <button
            className="btn secondary"
            type="submit"
            // eslint-disable-next-line react/no-unknown-property
            formNoValidate
          >
            מחק מבחן
          </button>
        </form>
      </div>
    </div>
  );
}
