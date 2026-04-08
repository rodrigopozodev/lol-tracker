import {
  getLatestSnapshot,
  listAccounts,
  upsertChampionAggregateCache,
  type ChampionAggregateStoredPayload,
} from "@/lib/db";
import {
  aggregateRankedChampionStatsForAccount,
  aggMapToSortedRows,
  mergeChampionAggMaps,
} from "@/lib/riot/aggregateRankedChampionStats";
import { getPublicRankedSeasonYear } from "@/lib/rankedSeasonYear";
import { getRiotApiKey } from "@/lib/riotApiKey";

export const CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT = 55;

function championIconUrl(championId: number | null): string | null {
  if (championId == null) return null;
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
}

export async function computeChampionAggregatePayload(perAccount: number): Promise<
  { ok: true; payload: ChampionAggregateStoredPayload } | { ok: false; error: string }
> {
  const token = getRiotApiKey();
  if (!token) {
    return { ok: false, error: "RIOT_API_KEY no configurada" };
  }

  const seasonYear = getPublicRankedSeasonYear();
  const accounts = listAccounts();
  const merged = new Map<
    string,
    { champion: string; championId: number | null; games: number; wins: number }
  >();
  const accountNotes: ChampionAggregateStoredPayload["accountNotes"] = [];
  const errors: string[] = [];
  let anyTruncated = false;

  for (const acc of accounts) {
    const label = `${acc.game_name}#${acc.tag_line}`;
    const snap = getLatestSnapshot(acc.id);
    if (!snap?.puuid) {
      accountNotes.push({
        label,
        detailCalls: 0,
        truncated: false,
        skipped: "sin PUUID en snapshot; refresca cuentas",
      });
      continue;
    }
    const platform = (acc.region_cluster || "euw1").toLowerCase();
    try {
      const { byChampion, detailCalls, truncated } = await aggregateRankedChampionStatsForAccount({
        token,
        puuid: snap.puuid,
        platform,
        seasonYear,
        maxDetailCalls: perAccount,
      });
      mergeChampionAggMaps(merged, byChampion);
      accountNotes.push({ label, detailCalls, truncated });
      if (truncated) anyTruncated = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${label}: ${msg}`);
      accountNotes.push({ label, detailCalls: 0, truncated: false, skipped: msg });
    }
  }

  const top = aggMapToSortedRows(merged, 15).map((r, i) => ({
    rank: i + 1,
    champion: r.champion,
    championId: r.championId,
    iconUrl: championIconUrl(r.championId),
    games: r.games,
    wins: r.wins,
    losses: r.losses,
    winRate: r.winRate,
  }));

  const payload: ChampionAggregateStoredPayload = {
    seasonYear,
    queues: ["Solo/Duo (420)", "Flex (440)"],
    perAccountMaxDetailCalls: perAccount,
    truncated: anyTruncated,
    accountNotes,
    errors,
    top,
  };

  return { ok: true, payload };
}

/** Calcula con Riot y escribe `champion_aggregate_cache`. */
export async function rebuildChampionAggregateCache(
  perAccount: number = CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT
): Promise<
  | { ok: true; capturedAt: number; payload: ChampionAggregateStoredPayload }
  | { ok: false; error: string }
> {
  const result = await computeChampionAggregatePayload(perAccount);
  if (!result.ok) return result;

  const now = Date.now();
  upsertChampionAggregateCache({ capturedAt: now, payload: result.payload });
  return { ok: true, capturedAt: now, payload: result.payload };
}
