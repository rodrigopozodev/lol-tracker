import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

async function fetchSummonerByPuuid(puuid: string) {
  if (!RIOT_API_KEY) return null;
  for (const cluster of CLUSTERS) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return { ...json, region: cluster };
      }
    } catch (e) {
      // continuar
    }
  }
  return null;
}

export async function GET(req: Request) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");
  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  const summoner = await fetchSummonerByPuuid(puuid);
  if (!summoner?.id || !summoner?.region) {
    return NextResponse.json({ error: "No se pudo resolver el invocador" }, { status: 404 });
  }

  const leagueUrl = `https://${summoner.region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summoner.id)}`;
  try {
    const res = await fetch(leagueUrl, { headers: { "X-Riot-Token": (RIOT_API_KEY || "") }, cache: "no-store" });
    if (!res.ok) {
      // fallo frecuente con 403 cuando el token caduca
      const text = await res.text();
      return NextResponse.json({ error: text || "Error obteniendo ligas", status: res.status }, { status: res.status });
    }
    const entries: any[] = await res.json();
    const normalized = entries
      .filter((e) => e && e.queueType)
      .map((e) => ({
        queue: e.queueType,
        tier: e.tier,
        rank: e.rank,
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
      }));
    const solo = normalized.find((x) => x.queue === "RANKED_SOLO_5x5") || null;
    const flex = normalized.find((x) => x.queue === "RANKED_FLEX_SR") || null;
    return NextResponse.json({ solo, flex, entries: normalized, region: summoner.region });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}