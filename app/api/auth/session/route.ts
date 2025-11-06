import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseSessionCookie } from "@/lib/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const payload = parseSessionCookie(token);
    if (!payload || !payload.user?.id) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    return NextResponse.json({ authenticated: true, user: payload.user }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ authenticated: false, error: e?.message || "Error" }, { status: 200 });
  }
}