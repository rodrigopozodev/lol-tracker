import { NextResponse } from "next/server";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { riotFetch } from "@/lib/riot/riotFetch";
import { isRemakeParticipant } from "@/lib/riot/isRemakeMatch";
import {
  fetchSeasonRankedMatchesForQueue,
  MATCH_SEASON_CLUSTERS,
} from "@/lib/riot/matchSeason";

const CLUSTERS = [
  "euw1",
  "eun1",
  "na1",
  "kr",
  "br1",
  "la1",
  "la2",
  "jp1",
  "oc1",
  "ru",
  "tr1",
];

const MAX_MATCH_DETAIL_CALLS_SIMPLE = 20;

function getRegionalCluster(platform: string): "americas" | "europe" | "asia" {
  const p = platform.toLowerCase();
  if (["na1", "br1", "la1", "la2", "oc1"].includes(p)) return "americas";
  if (["euw1", "eun1", "tr1", "ru"].includes(p)) return "europe";
  if (["kr", "jp1"].includes(p)) return "asia";
  return "europe";
}

async function fetchSummonerByPuuid(puuid: string, preferredPlatform: string | null) {
  const key = getRiotApiKey();
  if (!key) return null;
  const pref = preferredPlatform?.toLowerCase().trim() || "";
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
      /* siguiente cluster */
    }
  }
  return null;
}

function queueLabel(queueId?: number | null): string {
  switch (queueId) {
    case 420:
      return "Solo/Duo";
    case 440:
      return "Flex";
    case 400:
      return "Normal (Draft)";
    case 430:
      return "Normal (Blind)";
    case 450:
      return "ARAM";
    case 700:
      return "Clash";
    default:
      return "Partida";
  }
}

type MatchRow = {
  id: string;
  ts: number | null;
  mode: string | null;
  queueId: number | null;
  queueLabel: string;
  durationSec: number | null;
  champion: string | null;
  remake: boolean;
  win: boolean;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kda: number | null;
};

function infoTimestampMs(info: Record<string, unknown>): number | null {
  const ge = info.gameEndTimestamp;
  const gs = info.gameStartTimestamp;
  const gc = info.gameCreation;
  if (typeof ge === "number" && ge > 0) return ge;
  if (typeof gs === "number" && gs > 0) return gs;
  if (typeof gc === "number" && gc > 0) {
    if (gc < 1e12) return gc * 1000;
    return gc;
  }
  return null;
}

async function fetchMatchRow(
  group: string,
  id: string,
  token: string,
  puuid: string
): Promise<MatchRow | { id: string; error: true }> {
  try {
    const mRes = await riotFetch(
      `https://${group}.api.riotgames.com/lol/match/v5/matches/${id}`,
      token
    );
    if (!mRes.ok) return { id, error: true };
    const m = await mRes.json();
    const info = (m?.info || {}) as Record<string, unknown>;
    const me = Array.isArray(info.participants)
      ? (
          info.participants as {
            puuid?: string;
            championName?: string;
            win?: boolean;
            gameEndedInEarlySurrender?: boolean;
            kills?: number;
            deaths?: number;
            assists?: number;
          }[]
        ).find((p) => p?.puuid === puuid)
      : null;
    const ts = infoTimestampMs(info);
    const kills = me?.kills ?? null;
    const deaths = me?.deaths ?? null;
    const assists = me?.assists ?? null;
    const remake = isRemakeParticipant(me);
    return {
      id,
      ts,
      mode: (info.gameMode as string) || null,
      queueId: (info.queueId as number) ?? null,
      queueLabel: queueLabel(info.queueId as number),
      durationSec: (info.gameDuration as number) ?? null,
      champion: me?.championName || null,
      remake,
      win: Boolean(me?.win),
      kills,
      deaths,
      assists,
      kda:
        typeof kills === "number" && typeof deaths === "number" && typeof assists === "number"
          ? (kills + assists) / Math.max(1, deaths)
          : null,
    };
  } catch {
    return { id, error: true };
  }
}

function resolvePlatform(
  puuid: string,
  platformHint: string | null
): Promise<{ platform: string } | { error: Response }> {
  const hint = platformHint?.toLowerCase().trim() || "";
  if (hint && (MATCH_SEASON_CLUSTERS as readonly string[]).includes(hint)) {
    return Promise.resolve({ platform: hint });
  }
  return fetchSummonerByPuuid(puuid, platformHint).then((summoner) => {
    if (!summoner?.region) {
      return {
        error: NextResponse.json(
          { error: "No se pudo resolver región del invocador" },
          { status: 404 }
        ),
      };
    }
    return { platform: summoner.region as string };
  });
}

export async function GET(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");
  const platformHint = searchParams.get("platform")?.trim() || null;
  const count = Number(searchParams.get("count") || 8);
  const queueRaw = searchParams.get("queue");
  const queueFilter =
    queueRaw != null && queueRaw !== "" ? Math.floor(Number(queueRaw)) : null;
  const seasonYearRaw = searchParams.get("seasonYear");
  const seasonYear =
    seasonYearRaw != null && seasonYearRaw !== ""
      ? Math.floor(Number(seasonYearRaw))
      : null;

  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  if (seasonYear != null && (!Number.isFinite(seasonYear) || seasonYear < 2000 || seasonYear > 2100)) {
    return NextResponse.json({ error: "seasonYear inválido" }, { status: 400 });
  }

  if (seasonYear != null && (queueFilter == null || !Number.isFinite(queueFilter) || queueFilter <= 0)) {
    return NextResponse.json(
      { error: "Con seasonYear hace falta queue (420 o 440)" },
      { status: 400 }
    );
  }

  const resolved = await resolvePlatform(puuid, platformHint);
  if ("error" in resolved) return resolved.error;

  const { platform } = resolved;
  const group = getRegionalCluster(platform);
  const token = getRiotApiKey()!;

  try {
    if (seasonYear != null) {
      const result = await fetchSeasonRankedMatchesForQueue({
        token,
        puuid,
        platform,
        queue: queueFilter!,
        seasonYear,
        matchShow: count,
      });
      if (!result.ok) {
        if (result.status === 429) {
          return NextResponse.json(
            { error: "Límite de peticiones de Riot (429). Espera un minuto y recarga." },
            { status: 503 }
          );
        }
        const st = result.status >= 400 && result.status < 600 ? result.status : 502;
        return NextResponse.json(
          { error: result.error || "Error obteniendo partidas", status: result.status },
          { status: st }
        );
      }
      return NextResponse.json({
        region: platform,
        group: result.group,
        seasonYear,
        matches: result.matches,
        streak: result.streak,
      });
    }

    const capped = Math.max(1, Math.min(count, MAX_MATCH_DETAIL_CALLS_SIMPLE));
    let idsUrl = `https://${group}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=${capped}`;
    if (queueFilter != null && Number.isFinite(queueFilter) && queueFilter > 0) {
      idsUrl += `&queue=${queueFilter}`;
    }

    const idsRes = await riotFetch(idsUrl, token);
    if (!idsRes.ok) {
      if (idsRes.status === 429) {
        return NextResponse.json(
          { error: "Límite de peticiones de Riot (429). Espera un minuto y recarga." },
          { status: 503 }
        );
      }
      const text = await idsRes.text();
      return NextResponse.json(
        { error: text || "Error obteniendo ids de partidas", status: idsRes.status },
        { status: idsRes.status }
      );
    }
    const ids: string[] = await idsRes.json();

    const raw: Array<MatchRow | { id: string; error: true }> = [];
    for (const id of ids.slice(0, MAX_MATCH_DETAIL_CALLS_SIMPLE)) {
      raw.push(await fetchMatchRow(group, id, token, puuid));
    }

    const matches = raw
      .filter((row): row is MatchRow => !("error" in row && row.error) && Boolean((row as MatchRow).champion))
      .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));

    return NextResponse.json({ region: platform, group, matches });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
