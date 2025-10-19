import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

function getRegionalCluster(platform: string): "americas" | "europe" | "asia" {
  const p = platform.toLowerCase();
  if (["na1","br1","la1","la2","oc1"].includes(p)) return "americas";
  if (["euw1","eun1","tr1","ru"].includes(p)) return "europe";
  if (["kr","jp1"].includes(p)) return "asia";
  return "europe";
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

function queueLabel(queueId?: number | null): string {
  switch (queueId) {
    case 420: return "Solo/Duo";
    case 440: return "Flex";
    case 400: return "Normal (Draft)";
    case 430: return "Normal (Blind)";
    case 450: return "ARAM";
    case 700: return "Clash";
    default: return "Partida";
  }
}

export async function GET(req: Request) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");
  const count = Number(searchParams.get("count") || 8);
  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  const summoner = await fetchSummonerByPuuid(puuid);
  if (!summoner?.region) {
    return NextResponse.json({ error: "No se pudo resolver región del invocador" }, { status: 404 });
  }

  const group = getRegionalCluster(summoner.region);
  const idsUrl = `https://${group}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${Math.max(1, Math.min(count, 20))}`;

  try {
    const idsRes = await fetch(idsUrl, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
    if (!idsRes.ok) {
      const text = await idsRes.text();
      return NextResponse.json({ error: text || "Error obteniendo ids de partidas", status: idsRes.status }, { status: idsRes.status });
    }
    const ids: string[] = await idsRes.json();

    const matches = await Promise.all(
      ids.map(async (id) => {
        try {
          const mRes = await fetch(`https://${group}.api.riotgames.com/lol/match/v5/matches/${id}`, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
          if (!mRes.ok) {
            return { id, error: true, status: mRes.status };
          }
          const m = await mRes.json();
          const info = m?.info || {};
          const me = Array.isArray(info.participants) ? info.participants.find((p: any) => p?.puuid === puuid) : null;
          return {
            id,
            ts: info.gameStartTimestamp || info.gameEndTimestamp || null,
            mode: info.gameMode || null,
            queueId: info.queueId || null,
            queueLabel: queueLabel(info.queueId),
            durationSec: info.gameDuration || null,
            champion: me?.championName || null,
            win: Boolean(me?.win),
            kills: me?.kills ?? null,
            deaths: me?.deaths ?? null,
            assists: me?.assists ?? null,
            kda: me ? ((me.kills + me.assists) / Math.max(1, me.deaths)) : null,
          };
        } catch {
          return { id, error: true };
        }
      })
    );

    return NextResponse.json({ region: summoner.region, group, matches });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}