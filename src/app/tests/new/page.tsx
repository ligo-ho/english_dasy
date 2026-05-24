import Link from 'next/link';
import { listWordBanks } from '@/lib/queries';
import { createTestAction } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default function NewTestPage() {
  const banks = listWordBanks();

  if (banks.length === 0) {
    return (
      <div>
        <h1>יצירת מבחן חדש</h1>
        <div className="alert info">
          אין עדיין מאגרי מילים. <Link href="/banks/new">צור מאגר חדש</Link> כדי להתחיל.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>יצירת מבחן חדש</h1>
      <p className="muted">בחר את המאגר שעליו יתבצע המבחן ותן לו שם.</p>
      <form action={createTestAction} className="card">
        <div className="form-field">
          <label htmlFor="name">שם המבחן</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="לדוגמה: תרגול שבועי 5"
          />
        </div>
        <div className="form-field">
          <label htmlFor="bankId">מאגר מילים</label>
          <select id="bankId" name="bankId" required defaultValue="">
            <option value="" disabled>
              -- בחר מאגר --
            </option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.item_count ?? 0} מילים)
              </option>
            ))}
          </select>
        </div>
        <div className="btn-row" style={{ marginTop: 20 }}>
          <button type="submit" className="btn">
            צור מבחן
          </button>
          <Link href="/" className="btn secondary">
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}
