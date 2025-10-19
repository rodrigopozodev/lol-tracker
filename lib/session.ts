import { NextResponse } from "next/server";
import crypto from "crypto";
import { ENV } from "@/config/env";

function sign(payload: Record<string, any>, secret: string) {
  const json = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret || "dev-secret");
  hmac.update(json);
  const signature = hmac.digest("hex");
  const token = Buffer.from(json).toString("base64") + "." + signature;
  return token;
}

export function attachSessionCookie(res: NextResponse, payload: { user: { email: string; id?: string } }) {
  const token = sign({ user: payload.user, iat: Date.now() }, ENV.SESSION_SECRET);
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: ENV.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return res;
}

// Verifica y parsea la cookie de sesión
export function parseSessionCookie(token?: string): null | { user: { email: string; id?: string }, iat: number } {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, signature] = parts;
  let json: string;
  try {
    json = Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return null;
  }
  const hmac = crypto.createHmac("sha256", ENV.SESSION_SECRET || "dev-secret");
  hmac.update(json);
  const expected = hmac.digest("hex");
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(json);
    return payload;
  } catch {
    return null;
  }
}