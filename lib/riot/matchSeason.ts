import { isRemakeParticipant } from "@/lib/riot/isRemakeMatch";
import { enrichMatchesWithLobbyAvgTier } from "@/lib/riot/matchLobbyTier";
import { riotFetch } from "@/lib/riot/riotFetch";

export const MATCH_SEASON_CLUSTERS = [
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
] as const;

const ID_PAGE = 20;
const MAX_ID_SCAN = 200;
const MAX_MATCH_DETAIL_CALLS_SEASON = 24;
/** Partidas en temporada necesarias antes de parar (solo mostramos ~4; margen para rachas/remakes). */
function enoughSeasonMatchesForTarget(target: number): number {
  const t = Math.max(1, Math.min(20, Math.floor(target) || 4));
  return Math.min(18, Math.max(t + 6, 8));
}

const MATCH_DETAIL_PARALLEL = 5;

export function getRegionalClusterForPlatform(platform: string): "americas" | "europe" | "asia" {
  const p = platform.toLowerCase();
  if (["na1", "br1", "la1", "la2", "oc1"].includes(p)) return "americas";
  if (["euw1", "eun1", "tr1", "ru"].includes(p)) return "europe";
  if (["kr", "jp1"].includes(p)) return "asia";
  return "europe";
}

export type SeasonMatchRow = {
  id: string;
  ts: number | null;
  mode: string | null;
  queueId: number | null;
  queueLabel: string;
  durationSec: number | null;
  champion: string | null;
  championId: number | null;
  remake: boolean;
  win: boolean;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kda: number | null;
  /** PUUIDs del lobby; se elimina tras calcular lobbyAvgTierLabel. */
  participantPuuids?: string[];
  /** Media de tier (misma cola que la partida) entre jugadores con liga en esa cola. */
  lobbyAvgTierLabel?: string | null;
};

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

export async function fetchMatchRowDetail(
  group: string,
  id: string,
  token: string,
  puuid: string
): Promise<SeasonMatchRow | { id: string; error: true }> {
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
            championId?: number;
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
    const participantPuuids = Array.isArray(info.participants)
      ? (info.participants as { puuid?: string }[])
          .map((p) => p?.puuid)
          .filter((x): x is string => typeof x === "string" && x.length > 0)
      : [];
    return {
      id,
      ts,
      mode: (info.gameMode as string) || null,
      queueId: (info.queueId as number) ?? null,
      queueLabel: queueLabel(info.queueId as number),
      durationSec: (info.gameDuration as number) ?? null,
      champion: me?.championName || null,
      championId: typeof me?.championId === "number" ? me.championId : null,
      remake,
      win: Boolean(me?.win),
      kills,
      deaths,
      assists,
      kda:
        typeof kills === "number" && typeof deaths === "number" && typeof assists === "number"
          ? (kills + assists) / Math.max(1, deaths)
          : null,
      participantPuuids,
    };
  } catch {
    return { id, error: true };
  }
}

export function streakFromNewestFirst(rows: SeasonMatchRow[]): { wins: boolean; count: number } | null {
  const valid = rows.filter(
    (r) => !r.remake && typeof r.win === "boolean" && r.ts != null
  );
  if (!valid.length) return null;
  const firstWin = valid[0].win === true;
  let n = 0;
  for (const r of valid) {
    if ((r.win === true) === firstWin) n++;
    else break;
  }
  if (n <= 0) return null;
  return { wins: firstWin, count: n };
}

/**
 * Partidas clasificatorias de una cola dentro del año de temporada, sin llamar a summoner-v4
 * (usa `platform` ya conocido, p. ej. desde SQLite).
 */
export async function fetchSeasonRankedMatchesForQueue(opts: {
  token: string;
  puuid: string;
  platform: string;
  queue: number;
  seasonYear: number;
  matchShow: number;
}): Promise<{
  ok: true;
  matches: SeasonMatchRow[];
  streak: { wins: boolean; count: number } | null;
  group: string;
} | { ok: false; status: number; error: string }> {
  const { token, puuid, platform, queue, seasonYear, matchShow } = opts;
  const plat = platform.toLowerCase().trim();
  if (!MATCH_SEASON_CLUSTERS.includes(plat as (typeof MATCH_SEASON_CLUSTERS)[number])) {
    return { ok: false, status: 400, error: "platform inválido" };
  }

  const group = getRegionalClusterForPlatform(plat);
  const yearStart = Date.UTC(seasonYear, 0, 1);
  const yearEnd = Date.UTC(seasonYear + 1, 0, 1);
  const target = Math.max(1, Math.min(Math.floor(matchShow) || 4, 20));
  const enoughInSeason = enoughSeasonMatchesForTarget(target);
  const inYear: SeasonMatchRow[] = [];
  const seen = new Set<string>();
  let startIdx = 0;
  let stopPaging = false;
  let detailCalls = 0;

  outer: while (!stopPaging && startIdx < MAX_ID_SCAN && detailCalls < MAX_MATCH_DETAIL_CALLS_SEASON) {
    const idsUrl = `https://${group}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=${queue}&start=${startIdx}&count=${ID_PAGE}`;
    const idsRes = await riotFetch(idsUrl, token);
    if (!idsRes.ok) {
      const text = await idsRes.text();
      return {
        ok: false,
        status: idsRes.status,
        error: text || "Error obteniendo ids de partidas",
      };
    }
    const ids: string[] = await idsRes.json();
    if (!Array.isArray(ids) || ids.length === 0) break;

    for (let bi = 0; bi < ids.length; bi += MATCH_DETAIL_PARALLEL) {
      if (detailCalls >= MAX_MATCH_DETAIL_CALLS_SEASON) {
        stopPaging = true;
        break outer;
      }
      const room = MAX_MATCH_DETAIL_CALLS_SEASON - detailCalls;
      const batch = ids.slice(bi, bi + Math.min(MATCH_DETAIL_PARALLEL, room));
      if (batch.length === 0) break;

      const rows = await Promise.all(
        batch.map((id) => fetchMatchRowDetail(group, id, token, puuid))
      );
      detailCalls += batch.length;

      for (const row of rows) {
        if ("error" in row && row.error) continue;
        const m = row as SeasonMatchRow;
        if (m.remake) continue;
        if (!m.champion || m.ts == null) continue;
        if (m.ts >= yearEnd) continue;
        if (m.ts < yearStart) {
          stopPaging = true;
          break outer;
        }
        if (!seen.has(m.id)) {
          seen.add(m.id);
          inYear.push(m);
          if (inYear.length >= enoughInSeason) {
            stopPaging = true;
            break outer;
          }
        }
      }
    }

    startIdx += ids.length;
    if (ids.length < ID_PAGE) stopPaging = true;
  }

  inYear.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  const streak = streakFromNewestFirst(inYear);
  const matches = inYear.slice(0, target);

  await enrichMatchesWithLobbyAvgTier(matches, plat, token, queue);

  return { ok: true, matches, streak, group };
}
