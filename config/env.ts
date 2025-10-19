export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.PUBLIC_SUPABASE_URL ??
    "",
  SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.PUBLIC_SUPABASE_ANON_KEY ??
    "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",
  // Email provider (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "",
  // SMTP/Gmail
  SMTP_HOST: process.env.SMTP_HOST ?? process.env.GMAIL_SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? process.env.GMAIL_SMTP_PORT ?? 0),
  SMTP_USER: process.env.SMTP_USER ?? process.env.GMAIL_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? process.env.GMAIL_FROM ?? "",
  // SMS provider (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? "",
  TWILIO_FROM: process.env.TWILIO_FROM ?? "",
  TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID ?? "",
  // App URL for links in emails
  APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3002",
}