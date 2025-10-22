import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

let CHAMPION_CACHE: Record<string, { id: string; name: string }> | null = null;

async function getChampionCache() {
  if (CHAMPION_CACHE) return CHAMPION_CACHE;
  try {
    // Use Spanish names for display; id alias is language-agnostic
    const res = await fetch("https://ddragon.leagueoflegends.com/cdn/14.21.1/data/es_ES/champion.json", { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed champion.json");
    const json = await res.json();
    const data = json?.data || {};
    const map: Record<string, { id: string; name: string }> = {};
    for (const key of Object.keys(data)) {
      const c = data[key];
      if (c && c.key && c.id) {
        map[String(c.key)] = { id: String(c.id), name: String(c.name) };
      }
    }
    CHAMPION_CACHE = map;
    return map;
  } catch {
    return {};
  }
}

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
  const count = Math.max(1, Math.min(Number(searchParams.get("count") || 4), 10));
  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  const summoner = await fetchSummonerByPuuid(puuid);
  if (!summoner?.region) {
    return NextResponse.json({ error: "No se pudo resolver región del invocador" }, { status: 404 });
  }

  try {
    const url = `https://${summoner.region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`;
    const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Error obteniendo maestrías", status: res.status }, { status: res.status });
    }
    const list = await res.json();
    const champs = Array.isArray(list) ? list : [];
    const cache = await getChampionCache();
    const sorted = champs.sort((a: any, b: any) => (b?.championPoints || 0) - (a?.championPoints || 0)).slice(0, count);

    const normalized = sorted.map((m: any) => {
      const key = String(m?.championId ?? "");
      const mapping = cache[key];
      return {
        championId: m?.championId ?? null,
        championAlias: mapping?.id ?? null,
        championName: mapping?.name ?? null,
        championLevel: m?.championLevel ?? null,
        championPoints: m?.championPoints ?? 0,
      };
    });

    return NextResponse.json({ region: summoner.region, masteries: normalized });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}