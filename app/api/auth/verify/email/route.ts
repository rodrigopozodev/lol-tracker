import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { attachSessionCookie } from "@/lib/session";

export async function GET(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("email, phone_verified")
      .eq("email_verification_token", token)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Token no válido o expirado" }, { status: 400 });
    }

    const status = user.phone_verified ? "active" : "pending_verification";

    const { error: updateErr } = await supabase
      .from("users")
      .update({ email_verified: true, email_verification_token: null, status })
      .eq("email_verification_token", token);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const res = NextResponse.json({ message: "Email verificado", status });
    if (status === "active") {
      attachSessionCookie(res, { user: { email: user.email } });
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}
export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // Buscar usuario por token de verificación
    const { data: user, error } = await supabase
      .from("users")
      .select("email, phone_verified")
      .eq("email_verification_token", token)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: "Token no válido o expirado" }, { status: 400 });
    }

    const status = user.phone_verified ? "active" : "pending_verification";

    const { error: updateErr } = await supabase
      .from("users")
      .update({ email_verified: true, email_verification_token: null, status })
      .eq("email_verification_token", token);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const res = NextResponse.json({ message: "Email verificado", status });
    if (status === "active") {
      attachSessionCookie(res, { user: { email: user.email } });
    }
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}