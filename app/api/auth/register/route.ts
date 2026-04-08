import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Registro desactivado. App en modo personal (SQLite, sin Supabase)." },
    { status: 410 }
  );
}
