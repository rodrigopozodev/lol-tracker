import twilio from "twilio";
import { ENV } from "@/config/env";

export async function sendVerificationSMS({ to, code }: { to: string; code: string }) {
  const hasCreds = Boolean(ENV.TWILIO_ACCOUNT_SID) && Boolean(ENV.TWILIO_AUTH_TOKEN);
  const hasSender = Boolean(ENV.TWILIO_MESSAGING_SERVICE_SID) || Boolean(ENV.TWILIO_FROM);
  if (!hasCreds || !hasSender) {
    console.warn("Twilio no configurado: faltan credenciales o remitente (FROM/MessagingServiceSid)");
    return false;
  }
  const client = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
  const body = `Tu código de verificación es: ${code}`;

  // Intentar con Messaging Service primero si está configurado
  if (ENV.TWILIO_MESSAGING_SERVICE_SID) {
    try {
      const msg = await client.messages.create({
        messagingServiceSid: ENV.TWILIO_MESSAGING_SERVICE_SID,
        to,
        body,
      } as any);
      return Boolean(msg?.sid);
    } catch (err: any) {
      const errorCode = err?.code;
      const errorMsg = err?.message || String(err);
      console.error("Fallo enviando SMS vía Messaging Service:", { code: errorCode, message: errorMsg });

      // Fallback automático si el servicio no tiene senders (21704) y tenemos FROM
      const canFallback = Boolean(ENV.TWILIO_FROM) && (errorCode === 21704 || errorMsg?.toLowerCase().includes("contains no senders"));
      if (canFallback) {
        try {
          const msg2 = await client.messages.create({
            from: ENV.TWILIO_FROM,
            to,
            body,
          } as any);
          return Boolean(msg2?.sid);
        } catch (err2) {
          console.error("Fallback vía FROM también falló:", err2);
          return false;
        }
      }
      return false;
    }
  }

  // Si no hay Messaging Service, usar FROM directamente
  try {
    const msg = await client.messages.create({
      from: ENV.TWILIO_FROM,
      to,
      body,
    } as any);
    return Boolean(msg?.sid);
  } catch (err) {
    console.error("Fallo enviando SMS con FROM:", err);
    return false;
  }
}