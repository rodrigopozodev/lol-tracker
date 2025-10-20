import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { parseSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];
const ACCOUNT_GROUPS = ["europe","americas","asia"];

async function findPuuidBySummonerName(name: string): Promise<string | null> {
  if (!RIOT_API_KEY) return null;
  for (const cluster of CLUSTERS) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`;
    try {
      const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.puuid) return json.puuid as string;
      }
    } catch {}
  }
  return null;
}

async function fetchPuuidByRiotId(gameName: string, tagLine: string): Promise<string | null> {
  if (!RIOT_API_KEY) return null;
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    try {
      const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.puuid) return json.puuid as string;
      }
      if (res.status === 403) {
        // token inválido/caducado
        return null;
      }
    } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin no configurado" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const cookie = cookieStore.get("session")?.value;
    const session = parseSessionCookie(cookie);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // Obtener metadata actual
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = (userData?.user as any)?.user_metadata || {};
    let puuid: string | null = meta?.riot_puuid ?? null;

    // Resolver PUUID si falta
    if (!puuid) {
      const gameName: string | undefined = meta?.riot_gameName ?? undefined;
      const tagLine: string | undefined = meta?.riot_tagLine ?? undefined;
      const summonerName: string | undefined = meta?.riot_summoner_name ?? undefined;
      if (gameName && tagLine) {
        puuid = await fetchPuuidByRiotId(gameName, tagLine);
      }
      if (!puuid && summonerName) {
        puuid = await findPuuidBySummonerName(summonerName);
      }
    }

    if (!puuid || !RIOT_API_KEY) {
      return NextResponse.json({ error: "No se pudo resolver PUUID o falta RIOT_API_KEY" }, { status: 400 });
    }

    // Llamar a nuestra propia API para obtener datos del invocador por PUUID
    const headersList = await headers();
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const host = headersList.get("host") || "localhost:3000";
    const summonerUrl = `${protocol}://${host}/api/riot/summoner?puuid=${encodeURIComponent(puuid)}`;
    const res = await fetch(summonerUrl, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Error obteniendo datos del invocador" }, { status: res.status });
    }
    const summonerJson = await res.json();

    const updated = {
      ...meta,
      riot_puuid: puuid,
      riot_gameName: summonerJson?.gameName ?? meta.riot_gameName ?? null,
      riot_tagLine: summonerJson?.tagLine ?? meta.riot_tagLine ?? null,
      riot_summoner_name: summonerJson?.name ?? meta.riot_summoner_name ?? null,
      riot_profile_icon_id: summonerJson?.profileIconId ?? meta.riot_profile_icon_id ?? null,
      riot_summoner_level: summonerJson?.summonerLevel ?? meta.riot_summoner_level ?? null,
      riot_region: summonerJson?.region ?? meta.riot_region ?? null,
      riot_last_updated: Date.now(),
    } as Record<string, any>;

    await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updated });

    return NextResponse.json({ ok: true, metadata: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}