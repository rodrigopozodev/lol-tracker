import { NextResponse } from "next/server";
import { ENV } from "@/config/env";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMail, isSmtpConfigured } from "@/lib/mailer";

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    console.error("[send-gmail] Supabase Admin no configurado");
    return NextResponse.json({ error: "Supabase Admin no configurado" }, { status: 500 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (!isSmtpConfigured()) {
      console.error("[send-gmail] SMTP no configurado: rellena SMTP_HOST/PORT/USER/PASS/FROM en .env.local");
      return NextResponse.json({ error: "SMTP no configurado" }, { status: 500 });
    }

    // Generar enlace de confirmación con Supabase usando Service Role
    console.log("[send-gmail] Generando action_link", { email, redirectTo: `${ENV.APP_URL}/auth/verify-phone` });
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: { emailRedirectTo: `${ENV.APP_URL}/auth/verify-phone` },
    } as any);

    if (error) {
      console.error("[send-gmail] generateLink error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const actionLink = (data as any)?.action_link;
    if (!actionLink) {
      console.error("[send-gmail] No se recibió action_link", { data });
      return NextResponse.json({ error: "No se pudo generar el enlace de verificación" }, { status: 500 });
    }

    const subject = "Verifica tu correo - League Tracker";
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <h2>Confirma tu correo</h2>
        <p>Gracias por registrarte en League Tracker.</p>
        <p>Haz clic en el botón para verificar tu correo:</p>
        <p>
          <a href="${actionLink}" style="display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;">Verificar correo</a>
        </p>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p><a href="${actionLink}">${actionLink}</a></p>
      </div>
    `;

    await sendMail({ to: email, subject, html });

    console.log("[send-gmail] Correo enviado", { to: email });
    return NextResponse.json({ message: "Hemos enviado el email de verificación vía Gmail." });
  } catch (err: any) {
    console.error("[send-gmail] route error", err);
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}