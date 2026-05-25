"use client";

import { createTestAction } from "@/app/actions";
import { useEffect, useState } from "react";

export default function NewTestPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/banks").then((r) => r.json()).then(setBanks);
  }, []);

  return (
    <div className="card">
      <h2>יצירת מבחן חדש</h2>
      <form action={async (fd) => {
        setError("");
        const res = await createTestAction(fd);
        if (res?.error) setError(res.error);
      }} className="grid">
        <input name="name" placeholder="שם מבחן" required />
        <select name="bankId" required>
          <option value="">בחר מאגר מילים</option>
          {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit">צור מבחן</button>
      </form>
    </div>
  );
}
