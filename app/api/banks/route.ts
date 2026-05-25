import { db } from "@/lib/db";

export async function GET() {
  const rows = db.prepare("SELECT id, name FROM word_banks ORDER BY created_at DESC").all();
  return Response.json(rows);
}
