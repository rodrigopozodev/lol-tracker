import { NextResponse } from "next/server";
import { enrichMatchV5ParticipantsJson } from "@/lib/ddragon/championImageKey";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { riotFetch } from "@/lib/riot/riotFetch";
import { platformToRegionalCluster } from "@/lib/riot/regionalRouting";
import { isRiotPlatform } from "@/lib/riot/platforms";

/**
 * GET ?matchId=EUW1_123&platform=euw1
 * Devuelve el JSON completo de match-v5 (documentado en Riot) para la vista detalle.
 */
export async function GET(req: Request) {
  const key = getRiotApiKey();
  if (!key) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId")?.trim();
  const platform = searchParams.get("platform")?.trim().toLowerCase() || "";
  if (!matchId) {
    return NextResponse.json({ error: "Falta matchId" }, { status: 400 });
  }
  if (!platform || !isRiotPlatform(platform)) {
    return NextResponse.json({ error: "Falta platform válido (p. ej. euw1)" }, { status: 400 });
  }
  const group = platformToRegionalCluster(platform);
  const url = `https://${group}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
  const res = await riotFetch(url, key);
  if (!res.ok) {
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Límite de peticiones de Riot (429). Espera un momento." },
        { status: 503 }
      );
    }
    const t = await res.text();
    return NextResponse.json(
      { error: t || "No se pudo obtener la partida", status: res.status },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
    );
  }
  const json = await res.json();
  await enrichMatchV5ParticipantsJson(json);
  return NextResponse.json(json);
}
