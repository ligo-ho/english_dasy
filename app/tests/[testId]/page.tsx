import Link from "next/link";
import { db } from "@/lib/db";
import { answerQuestionAction, moveToReviewAction } from "@/app/actions";
import { shuffle } from "@/lib/utils";

export default function TestPage({ params }: { params: { testId: string } }) {
  const testId = Number(params.testId);
  const test = db.prepare("SELECT tests.*, word_banks.name as bank_name FROM tests JOIN word_banks ON tests.word_bank_id=word_banks.id WHERE tests.id=?").get(testId) as any;
  if (!test) return <div className="card">מבחן לא נמצא</div>;

  const total = test.round_correct + test.round_wrong;
  const pct = total ? Math.round((test.round_correct / total) * 100) : 0;

  if (test.state === "round_results" || test.state === "completed") {
    const hasMistakes = JSON.parse(test.latest_mistake_ids).length > 0;
    return <div className="card"><h2>תוצאה</h2><p>תשובות נכונות: {test.round_correct}</p><p>טעויות: {test.round_wrong}</p><p>אחוז הצלחה: {pct}%</p><div className="progressbar"><div style={{ width: `${pct}%` }} /></div>{hasMistakes ? <form action={moveToReviewAction.bind(null, testId)}><button className="primary">חזרה על מילים שטעיתי בהן</button></form> : <p>סיימת בהצלחה 🎉</p>}</div>;
  }

  if (test.state === "review") {
    return <div className="card"><p>עליך לעבור לדף החזרה.</p><Link href={`/tests/${testId}/review`}>למסך חזרה</Link></div>;
  }

  const roundIds: number[] = JSON.parse(test.round_item_ids);
  const currentId = roundIds[test.current_index];
  const item = db.prepare("SELECT * FROM word_items WHERE id = ?").get(currentId) as any;
  const options = shuffle([item.correct_hebrew, item.wrong_hebrew1, item.wrong_hebrew2, item.wrong_hebrew3]);

  return (
    <div className="card">
      <p className="small">{test.name} | מאגר: {test.bank_name} | שאלה {test.current_index + 1} מתוך {roundIds.length}</p>
      <h2>{item.english_text}</h2>
      <div className="options">
        {options.map((opt: string) => (
          <form key={opt} action={answerQuestionAction.bind(null, testId, opt)}><button type="submit">{opt}</button></form>
        ))}
      </div>
    </div>
  );
}
