import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Login desactivado. App en modo personal." },
    { status: 410 }
  );
}
