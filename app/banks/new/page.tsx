"use client";

import { useMemo, useState } from "react";
import { createBankAction } from "@/app/actions";
import { parsePastedTable } from "@/lib/utils";

export default function NewBankPage() {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const preview = useMemo(() => parsePastedTable(content), [content]);

  return (
    <div className="card">
      <h2>יצירת מאגר חדש</h2>
      <form action={async (fd) => {
        setError("");
        const res = await createBankAction(fd);
        if (res?.error) setError(res.error);
      }} className="grid">
        <input name="name" placeholder="שם מאגר" required />
        <textarea name="content" rows={12} placeholder="הדבק כאן טבלה מופרדת בטאבים" value={content} onChange={(e) => setContent(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        {preview.errors.length > 0 && <div className="error">{preview.errors.join(" ")}</div>}
        <div className="small">תצוגה מקדימה: {preview.parsed.length} שורות תקינות</div>
        <button className="primary" type="submit">שמירת מאגר</button>
      </form>
    </div>
  );
}
