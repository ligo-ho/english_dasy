import { db } from "@/lib/db";
import { startRetestAction } from "@/app/actions";

export default function ReviewPage({ params }: { params: { testId: string } }) {
  const testId = Number(params.testId);
  const test = db.prepare("SELECT latest_mistake_ids FROM tests WHERE id=?").get(testId) as any;
  if (!test) return <div className="card">מבחן לא נמצא</div>;

  const mistakes: number[] = JSON.parse(test.latest_mistake_ids);
  const rows = mistakes.length
    ? (db.prepare(`SELECT english_text, correct_hebrew FROM word_items WHERE id IN (${mistakes.map(() => "?").join(",")})`).all(...mistakes) as any[])
    : [];

  return (
    <div className="card">
      <h2>חזרה על מילים שטעיתי בהן</h2>
      {rows.length === 0 ? <p>אין מילים לחזרה.</p> : rows.map((r, i) => <p key={i}>{r.english_text} — {r.correct_hebrew}</p>)}
      <form action={startRetestAction.bind(null, testId)}><button className="primary">התחל מבחן חוזר</button></form>
    </div>
  );
}
