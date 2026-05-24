'use client';

import { useMemo, useState, useTransition } from 'react';
import { createBankAction } from '@/lib/actions';
import { parseTablePaste } from '@/lib/utils';

const EXAMPLE = [
  'apple\tתפוח\tאגס\tבננה\tתפוז',
  'book\tספר\tמחברת\tעיפרון\tעט',
  'house\tבית\tדירה\tחדר\tגג'
].join('\n');

export default function BankForm() {
  const [name, setName] = useState('');
  const [raw, setRaw] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => parseTablePaste(raw), [raw]);

  const canSubmit =
    name.trim().length > 0 && parsed.rows.length > 0 && parsed.errors.length === 0 && !pending;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createBankAction(fd);
      } catch (err) {
        if (err && typeof err === 'object' && 'message' in err) {
          setServerError(String((err as Error).message));
        } else {
          setServerError('אירעה שגיאה בעת שמירת המאגר.');
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card" noValidate>
      <div className="form-field">
        <label htmlFor="name">שם המאגר</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: שיעור 3 - פעלים"
        />
      </div>

      <div className="form-field">
        <label htmlFor="rows">תוכן הטבלה</label>
        <textarea
          id="rows"
          name="rows"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={EXAMPLE}
        />
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          הדבק ישירות מתאי טבלה ב-Excel/Google Sheets. שורות ריקות יידלגו.
        </p>
      </div>

      {raw.trim().length > 0 && (
        <div className="form-field">
          <h3>תצוגה מקדימה</h3>
          {parsed.errors.length > 0 && (
            <div className="alert error">
              <strong>שגיאות בנתונים:</strong>
              <ul style={{ margin: '6px 0 0', paddingInlineStart: 20 }}>
                {parsed.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed.rows.length > 0 ? (
            <>
              <p className="muted" style={{ marginBottom: 6 }}>
                נמצאו {parsed.rows.length} שורות תקינות.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>אנגלית</th>
                    <th>תרגום נכון</th>
                    <th>תרגום שגוי 1</th>
                    <th>תרגום שגוי 2</th>
                    <th>תרגום שגוי 3</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="eng-col">{r.englishText}</td>
                      <td>{r.correctHebrew}</td>
                      <td>{r.wrongHebrew1}</td>
                      <td>{r.wrongHebrew2}</td>
                      <td>{r.wrongHebrew3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 20 && (
                <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  מוצגות 20 שורות ראשונות מתוך {parsed.rows.length}.
                </p>
              )}
            </>
          ) : (
            parsed.errors.length === 0 && (
              <p className="muted">לא נמצאו שורות תקינות בטקסט שהוזן.</p>
            )
          )}
        </div>
      )}

      {serverError && <div className="alert error">{serverError}</div>}

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button type="submit" className="btn" disabled={!canSubmit}>
          {pending ? 'שומר...' : 'שמור מאגר'}
        </button>
        <a href="/" className="btn secondary">
          ביטול
        </a>
      </div>
    </form>
  );
}
