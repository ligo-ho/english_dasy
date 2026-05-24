import BankForm from './BankForm';

export default function NewBankPage() {
  return (
    <div>
      <h1>יצירת מאגר מילים חדש</h1>
      <p className="muted">
        הדבק טבלת מילים מ-Excel או מ-Google Sheets. כל שורה צריכה לכלול בדיוק 5 עמודות
        מופרדות בטאב: <strong>אנגלית</strong> | <strong>תרגום נכון</strong> |
        <strong> תרגום שגוי 1</strong> | <strong>תרגום שגוי 2</strong> |
        <strong> תרגום שגוי 3</strong>.
      </p>
      <BankForm />
    </div>
  );
}
