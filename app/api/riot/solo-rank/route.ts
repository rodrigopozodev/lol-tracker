import { NextResponse } from "next/server";
import { getRiotApiKey } from "@/lib/riotApiKey";

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

async function getSoloQRankByPuuid(puuid: string) {
  const key = getRiotApiKey();
  if (!key) {
    throw new Error("RIOT_API_KEY no configurada");
  }
  for (const region of CLUSTERS) {
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, {
        headers: { "X-Riot-Token": key },
        cache: "no-store",
      });
      if (!res.ok) {
        continue; // probar siguiente región
      }
      const entries: any[] = await res.json();
      const solo = entries.find((e) => e?.queueType === "RANKED_SOLO_5x5");
      if (!solo) {
        // Puede no tener soloQ en esta región; seguir buscando
        continue;
      }
      return { rank: `${solo.tier} ${solo.rank} (${solo.leaguePoints} LP)` };
    } catch {
      // probar siguiente región
      continue;
    }
  }
  return { rank: "Unranked" };
}

export async function GET(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");

  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  try {
    const result = await getSoloQRankByPuuid(puuid);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No se pudo obtener el rango" }, { status: 502 });
  }
}

export type SoloRankResponse = { rank: string };