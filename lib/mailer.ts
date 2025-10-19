import nodemailer from "nodemailer";
import { ENV } from "@/config/env";

export function isSmtpConfigured() {
  return (
    !!ENV.SMTP_HOST &&
    !!ENV.SMTP_PORT &&
    !!ENV.SMTP_USER &&
    !!ENV.SMTP_PASS &&
    !!ENV.SMTP_FROM
  );
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!isSmtpConfigured()) {
    console.error("[mailer] SMTP no configurado", {
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      user: ENV.SMTP_USER,
      from: ENV.SMTP_FROM,
    });
    throw new Error("SMTP no configurado");
  }

  const transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({ from: ENV.SMTP_FROM, to, subject, html });
    console.log("[mailer] Enviado", { to, messageId: info.messageId });
    return true;
  } catch (err) {
    console.error("[mailer] Error enviando correo", err);
    throw err;
  }
}