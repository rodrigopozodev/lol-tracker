import { NextResponse } from "next/server";
import { getDdragonCdnVersion } from "@/lib/ddragon/cdnVersion";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { riotFetch } from "@/lib/riot/riotFetch";
import { isRiotPlatform } from "@/lib/riot/platforms";

const CLUSTERS = ["euw1", "eun1", "na1", "kr", "br1", "la1", "la2", "jp1", "oc1", "ru", "tr1"];

let CHAMPION_CACHE: { version: string; map: Record<string, { id: string; name: string }> } | null = null;

async function getChampionCache() {
  try {
    const version = await getDdragonCdnVersion();
    if (CHAMPION_CACHE?.version === version) return CHAMPION_CACHE.map;
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/champion.json`,
      { next: { revalidate: 3600 } }
    );
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
    CHAMPION_CACHE = { version, map };
    return map;
  } catch {
    return {};
  }
}

async function fetchSummonerByPuuid(puuid: string, preferredCluster?: string | null) {
  const key = getRiotApiKey();
  if (!key) return null;
  const pref = preferredCluster?.toLowerCase().trim() || "";
  const order =
    pref && CLUSTERS.includes(pref) ? [pref, ...CLUSTERS.filter((c) => c !== pref)] : [...CLUSTERS];
  for (const cluster of order) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await riotFetch(url, key);
      if (res.ok) {
        const json = await res.json();
        return { ...json, region: cluster };
      }
    } catch {
      /* siguiente */
    }
  }
  return null;
}

export async function GET(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");
  const platformParam = searchParams.get("platform")?.trim() || null;
  const platformHint =
    platformParam && isRiotPlatform(platformParam.toLowerCase()) ? platformParam.toLowerCase() : null;
  const count = Math.max(1, Math.min(Number(searchParams.get("count") || 4), 10));
  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  const summoner = await fetchSummonerByPuuid(puuid, platformHint);
  if (!summoner?.region) {
    return NextResponse.json({ error: "No se pudo resolver región del invocador" }, { status: 404 });
  }

  try {
    const token = getRiotApiKey()!;
    const url = `https://${summoner.region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`;
    const res = await riotFetch(url, token);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Error obteniendo maestrías", status: res.status },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }
    const list = await res.json();
    const champs = Array.isArray(list) ? list : [];
    const cache = await getChampionCache();
    const sorted = champs
      .sort((a: { championPoints?: number }, b: { championPoints?: number }) => (b?.championPoints || 0) - (a?.championPoints || 0))
      .slice(0, count);

    const normalized = sorted.map((m: { championId?: number; championLevel?: number; championPoints?: number }) => {
      const key = String(m?.championId ?? "");
      const mapping = cache[key];
      const ddragonId = mapping?.id ?? null;
      return {
        championId: m?.championId ?? null,
        championAlias: ddragonId,
        championImageKey: ddragonId,
        championName: mapping?.name ?? null,
        championLevel: m?.championLevel ?? null,
        championPoints: m?.championPoints ?? 0,
      };
    });

    return NextResponse.json({ region: summoner.region, masteries: normalized });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
