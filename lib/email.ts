import { Resend } from "resend";
import { ENV } from "@/config/env";

export async function sendVerificationEmail({ to, token }: { to: string; token: string }) {
  if (!ENV.RESEND_API_KEY || !ENV.EMAIL_FROM) {
    console.warn("Resend no configurado: RESEND_API_KEY/EMAIL_FROM faltan");
    return false;
  }
  const resend = new Resend(ENV.RESEND_API_KEY);
  const verifyUrl = `${ENV.APP_URL}/api/auth/verify/email?token=${encodeURIComponent(token)}`;
  const subject = "Verifica tu correo - League Tracker";
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <h2>Confirma tu correo</h2>
      <p>Gracias por registrarte en League Tracker.</p>
      <p>Haz clic en el botón para verificar tu correo:</p>
      <p>
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;">Verificar correo</a>
      </p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <hr/>
      <small>Si no creaste esta cuenta, ignora este mensaje.</small>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({ from: ENV.EMAIL_FROM, to, subject, html });
    if (error) {
      console.error("Error enviando email de verificación:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Fallo enviando email de verificación:", err);
    return false;
  }
}