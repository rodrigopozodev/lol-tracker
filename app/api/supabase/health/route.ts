import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { ENV } from "@/config/env";

export async function GET() {
  const hasConfig = Boolean(ENV.SUPABASE_URL) && Boolean(ENV.SUPABASE_ANON_KEY);
  if (!hasConfig || !supabase) {
    return NextResponse.json({ ok: false, reason: "Missing env" }, { status: 500 });
  }

  // lightweight call that does not require tables or auth
  const { data: sessionData, error } = await supabase.auth.getSession();
  return NextResponse.json({ ok: true, session: sessionData ?? null, error: error ?? null });
}