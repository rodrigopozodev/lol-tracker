import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { ENV } from "@/config/env";

export async function POST(req: Request) {
  if (!supabase) {
    console.error("[email-resend] Supabase client no configurado", { SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL });
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      console.warn("[email-resend] Email inválido", { email });
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    console.log("[email-resend] Resend start", { email, redirectTo: `${ENV.APP_URL}/auth/login` });
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${ENV.APP_URL}/auth/login` },
    } as any);

    if (error) {
      console.error("[email-resend] supabase.auth.resend error", { message: error.message, email });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[email-resend] Resend ok", { email, data });
    return NextResponse.json({ message: "Hemos reenviado el email de verificación." });
  } catch (err: any) {
    console.error("[email-resend] route error", err);
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}