import Link from "next/link";
import { db } from "@/lib/db";

export default function HomePage() {
  const tests = db.prepare(`SELECT tests.*, word_banks.name as bank_name FROM tests JOIN word_banks ON tests.word_bank_id=word_banks.id ORDER BY tests.updated_at DESC`).all() as any[];

  return (
    <div className="grid">
      <div className="actions">
        <Link className="card" href="/banks/new">יצירת מאגר חדש</Link>
        <Link className="card" href="/tests/new">יצירת מבחן חדש</Link>
      </div>
      <div className="card">
        <h2>מבחנים קיימים</h2>
        {tests.length === 0 && <p>אין עדיין מבחנים.</p>}
        {tests.map((t) => {
          const total = t.round_correct + t.round_wrong;
          const pct = total ? Math.round((t.round_correct / total) * 100) : 0;
          const hasMistakes = JSON.parse(t.latest_mistake_ids).length > 0;
          return (
            <div key={t.id} className="card">
              <strong>{t.name}</strong>
              <p>מאגר: {t.bank_name}</p><p>מצב נוכחי: {t.state}</p>
              <p>תשובות נכונות: {t.round_correct} | טעויות: {t.round_wrong} | אחוז הצלחה: {pct}%</p>
              <p>ממתין לחזרה: {hasMistakes ? "כן" : "לא"}</p>
              <Link href={`/tests/${t.id}`}>המשך מבחן</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
