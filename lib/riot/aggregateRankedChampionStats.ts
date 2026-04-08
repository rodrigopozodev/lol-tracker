import {
  fetchMatchRowDetail,
  getRegionalClusterForPlatform,
  MATCH_SEASON_CLUSTERS,
  type SeasonMatchRow,
} from "./matchSeason";
import { riotFetch } from "./riotFetch";

const ID_PAGE = 100;
const MAX_ID_START = 600;

export type ChampionAggRow = {
  champion: string;
  championId: number | null;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
};

function mergeInto(
  agg: Map<string, { champion: string; championId: number | null; games: number; wins: number }>,
  champion: string,
  championId: number | null,
  win: boolean
) {
  const key = champion.trim() || "?";
  const cur = agg.get(key) || { champion: key, championId, games: 0, wins: 0 };
  cur.games += 1;
  if (win) cur.wins += 1;
  if (championId != null && cur.championId == null) cur.championId = championId;
  agg.set(key, cur);
}

/**
 * Recorre partidas clasificatorias (una cola) dentro del año de temporada y acumula por campeón.
 * Deja de pedir detalles al agotar `budget` llamadas a match-v5/matches/{id}.
 */
async function ingestQueue(
  opts: {
    token: string;
    puuid: string;
    platform: string;
    queue: number;
    seasonYear: number;
    budget: number;
    agg: Map<string, { champion: string; championId: number | null; games: number; wins: number }>;
  }
): Promise<{ callsUsed: number; hitBudget: boolean }> {
  const { token, puuid, platform, queue, seasonYear, budget, agg } = opts;
  const plat = platform.toLowerCase().trim();
  if (!MATCH_SEASON_CLUSTERS.includes(plat as (typeof MATCH_SEASON_CLUSTERS)[number])) {
    return { callsUsed: 0, hitBudget: false };
  }
  const group = getRegionalClusterForPlatform(plat);
  const yearStart = Date.UTC(seasonYear, 0, 1);
  const yearEnd = Date.UTC(seasonYear + 1, 0, 1);

  let callsUsed = 0;
  let startIdx = 0;
  const seen = new Set<string>();

  while (startIdx < MAX_ID_START && callsUsed < budget) {
    const idsUrl = `https://${group}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=${queue}&start=${startIdx}&count=${ID_PAGE}`;
    const idsRes = await riotFetch(idsUrl, token);
    if (!idsRes.ok) {
      break;
    }
    const ids: string[] = await idsRes.json();
    if (!Array.isArray(ids) || ids.length === 0) break;

    for (const id of ids) {
      if (callsUsed >= budget) {
        return { callsUsed, hitBudget: true };
      }
      const row = await fetchMatchRowDetail(group, id, token, puuid);
      callsUsed++;

      if ("error" in row && row.error) continue;
      const m = row as SeasonMatchRow;
      if (m.remake) continue;
      if (!m.champion || m.ts == null) continue;
      if (m.ts >= yearEnd) continue;
      if (m.ts < yearStart) {
        return { callsUsed, hitBudget: false };
      }
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      mergeInto(agg, m.champion, m.championId, m.win);
    }

    startIdx += ids.length;
    if (ids.length < ID_PAGE) break;
  }

  return { callsUsed, hitBudget: callsUsed >= budget };
}

export async function aggregateRankedChampionStatsForAccount(opts: {
  token: string;
  puuid: string;
  platform: string;
  seasonYear: number;
  /** Límite de GET match/{id} para esta cuenta (se reparte entre Solo y Flex). */
  maxDetailCalls: number;
}): Promise<{
  byChampion: Map<string, { champion: string; championId: number | null; games: number; wins: number }>;
  detailCalls: number;
  truncated: boolean;
}> {
  const cap = Math.max(1, opts.maxDetailCalls);
  const agg = new Map<string, { champion: string; championId: number | null; games: number; wins: number }>();
  let totalCalls = 0;
  let truncated = false;

  const solo = await ingestQueue({
    token: opts.token,
    puuid: opts.puuid,
    platform: opts.platform,
    queue: 420,
    seasonYear: opts.seasonYear,
    budget: cap,
    agg,
  });
  totalCalls += solo.callsUsed;
  if (solo.hitBudget) truncated = true;

  const flexBudget = Math.max(0, cap - totalCalls);
  if (flexBudget > 0) {
    const flex = await ingestQueue({
      token: opts.token,
      puuid: opts.puuid,
      platform: opts.platform,
      queue: 440,
      seasonYear: opts.seasonYear,
      budget: flexBudget,
      agg,
    });
    totalCalls += flex.callsUsed;
    if (flex.hitBudget) truncated = true;
  }

  return { byChampion: agg, detailCalls: totalCalls, truncated };
}

export function mergeChampionAggMaps(
  into: Map<string, { champion: string; championId: number | null; games: number; wins: number }>,
  from: Map<string, { champion: string; championId: number | null; games: number; wins: number }>
) {
  for (const [, v] of from) {
    const key = v.champion;
    const cur = into.get(key) || {
      champion: key,
      championId: v.championId,
      games: 0,
      wins: 0,
    };
    cur.games += v.games;
    cur.wins += v.wins;
    if (v.championId != null && cur.championId == null) cur.championId = v.championId;
    into.set(key, cur);
  }
}

export function aggMapToSortedRows(
  map: Map<string, { champion: string; championId: number | null; games: number; wins: number }>,
  limit: number
): ChampionAggRow[] {
  const rows: ChampionAggRow[] = [...map.values()].map((v) => {
    const losses = v.games - v.wins;
    return {
      champion: v.champion,
      championId: v.championId,
      games: v.games,
      wins: v.wins,
      losses,
      winRate: v.games > 0 ? Math.round((v.wins / v.games) * 1000) / 10 : 0,
    };
  });
  rows.sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games;
    return b.winRate - a.winRate;
  });
  return rows.slice(0, limit);
}
