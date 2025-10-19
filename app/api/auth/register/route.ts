import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import crypto from "crypto";
// import { sendVerificationEmail } from "@/lib/email"; // ya no se usa: Supabase mailer gestiona el email
import { sendVerificationSMS } from "@/lib/sms";
import { ENV } from "@/config/env";
import { promises as fs } from "fs";
import path from "path";

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const SALT_ROUNDS = 10;

function genPhoneCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function findPuuidBySummonerName(name: string): Promise<string | null> {
  const clusters = [
    "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
  ];
  const headers = { "X-Riot-Token": RIOT_API_KEY as string };
  for (const cluster of clusters) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`;
    try {
      console.log("[register] fallback summoner lookup", url);
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const puuid = json?.puuid as string | undefined;
        if (puuid) {
          console.log("[register] fallback found", { cluster, puuid: puuid.slice(0, 8) + "..." });
          return puuid;
        }
      }
    } catch (e) {
      console.warn("[register] fallback error", { cluster, error: (e as any)?.message });
    }
  }
  return null;
}

async function findUserIdByEmailAdmin(email: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any);
    if (error) return null;
    const found = data?.users?.find((u: any) => u?.email === email);
    return found?.id ?? null;
  } catch {
    return null;
  }
}

async function writeTmpPhoneCode(email: string, userId: string | null, code: string | null) {
  try {
    const tmpPath = path.resolve(process.cwd(), "tmp", "phone-codes.json");
    let current: Record<string, { userId: string | null; code: string | null }> = {};
    try {
      const buf = await fs.readFile(tmpPath, "utf8");
      current = JSON.parse(buf || "{}");
    } catch {}
    current[email] = { userId, code };
    await fs.mkdir(path.dirname(tmpPath), { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(current, null, 2), "utf8");
  } catch (e) {
    console.warn("[register] no se pudo escribir tmp/phone-codes.json", (e as any)?.message || e);
  }
}

async function mergeUserMetadata(userId: string, patch: Record<string, any>) {
  if (!supabaseAdmin) return;
  try {
    const { data: getUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const existingMeta = (getUserData?.user as any)?.user_metadata || {};
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { ...existingMeta, ...patch },
    });
  } catch (e) {
    console.warn("[register] fallo actualizando metadata", (e as any)?.message || e);
  }
}

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }
  if (!RIOT_API_KEY) {
    console.warn("[register] RIOT_API_KEY faltante; seguiremos sin Riot");
  }

  try {
    const { email, password, phone, gameName, tagLine } = await req.json();
    console.log("[register] payload", { email, hasPhone: !!phone, gameName, tagLine });

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan email y contraseña" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Intento best-effort de resolver PUUID (no bloqueante)
    let puuid: string | null = null;
    if (RIOT_API_KEY && gameName && tagLine) {
      const headers = { "X-Riot-Token": RIOT_API_KEY };
      const accountGroups = ["europe","americas","asia"];
      try {
        for (const group of accountGroups) {
          const riotUrl = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
          const riotRes = await fetch(riotUrl, { headers, cache: "no-store" });
          if (riotRes.ok) {
            const riotJson = await riotRes.json();
            puuid = riotJson?.puuid ?? null;
            console.log("[register] riot ok", { group, puuid: puuid?.slice(0, 8) + "..." });
            break;
          }
          if (riotRes.status === 403) {
            console.warn("[register] Riot token inválido/caducado (403)");
            break;
          }
        }
        if (!puuid) {
          puuid = await findPuuidBySummonerName(gameName);
        }
      } catch (e: any) {
        console.warn("[register] riot fetch error", e?.message || e);
        puuid = await findPuuidBySummonerName(gameName);
      }
    }

    // Crear usuario en Supabase Auth → email de verificación lo gestiona Supabase
    console.log("[register] supabase.auth.signUp start", { email, redirectTo: `${ENV.APP_URL}/auth/verify-phone` });
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${ENV.APP_URL}/auth/verify-phone`,
      },
    });
    if (signUpError) {
      console.error("[register] supabase.auth.signUp error", {
        message: signUpError.message,
        name: (signUpError as any)?.name,
        status: (signUpError as any)?.status,
        email,
      });
      return NextResponse.json({ error: signUpError.message }, { status: 500 });
    }
    console.log("[register] supabase.auth.signUp ok", { userId: signUpData?.user?.id, email: signUpData?.user?.email });

    const createdUserId = signUpData?.user?.id ?? (await findUserIdByEmailAdmin(email));
    if (!createdUserId) {
      console.warn("[register] No pudimos resolver userId tras signUp", { email });
    }

    // Guardar riot_puuid en user_metadata si está disponible
    if (supabaseAdmin && createdUserId && puuid) {
      await mergeUserMetadata(createdUserId, { riot_puuid: puuid });
    }

    // Enviar SMS con Twilio si está configurado
    let smsOk = false;
    let phoneCode: string | null = null;
    if (phone) {
      phoneCode = genPhoneCode();
      try {
        smsOk = await sendVerificationSMS({ to: phone, code: phoneCode });
      } catch (e) {
        console.warn("[register] error enviando SMS", (e as any)?.message || e);
      }
      // Guardar código en user_metadata con Service Role (merge seguro)
      if (supabaseAdmin && createdUserId && phoneCode) {
        await mergeUserMetadata(createdUserId, { phone, phone_code: phoneCode, phone_verified: false });
      }
      // Guardar también en tmp para facilitar verificación en desarrollo
      await writeTmpPhoneCode(email, createdUserId ?? null, phoneCode);
    }

    return NextResponse.json({
      message:
        puuid
          ? "Cuenta creada. Verifica tu teléfono por SMS. (PUUID resuelto)"
          : "Cuenta creada. Verifica tu teléfono por SMS. (PUUID pendiente)",
      status: "created",
      email_provider: "disabled",
      email_triggered: false,
      sms_sent: smsOk,
      user_id: createdUserId ?? null,
      dev_phone_code: process.env.NODE_ENV !== "production" ? phoneCode : undefined,
    });
  } catch (err: any) {
    console.error("[register] route error", err);
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}