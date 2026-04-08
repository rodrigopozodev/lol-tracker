import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Usa el botón Refrescar en /home o POST /api/cron/refresh-accounts" },
    { status: 410 }
  );
}
