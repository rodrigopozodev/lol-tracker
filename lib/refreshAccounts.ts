import {
  listAccounts,
  insertSnapshot,
  getLatestSnapshot,
  getChampionAggregateCache,
  updateAccountRegionCluster,
  type AccountRow,
} from "@/lib/db";
import {
  CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT,
  rebuildChampionAggregateCache,
} from "@/lib/championAggregatePersist";
import { getLatestDdragonVersion } from "@/lib/ddAssets";
import { mapPool } from "@/lib/promisePool";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { fetchLeagueEntriesByPuuid } from "@/lib/riot/leagueByPuuid";
import { fetchSeasonRankedMatchesForQueue } from "@/lib/riot/matchSeason";
import { resolvePlayersSimple, type MultiSearchPlayerResult } from "@/lib/riot/multiSearchCore";
import { getPublicRankedSeasonYear } from "@/lib/rankedSeasonYear";
import { writeAccountsSnapshotJson } from "@/lib/writeAccountsSnapshotJson";

function defaultRegionHint(): string | null {
  const r = process.env.DEFAULT_RIOT_REGION;
  if (r && /^[a-z0-9]+$/i.test(r)) return r;
  return "euw1";
}

function refreshConcurrency(): number {
  const n = parseInt(process.env.RIOT_REFRESH_CONCURRENCY || "4", 10);
  return Number.isFinite(n) ? Math.min(8, Math.max(1, n)) : 4;
}

/** Tiempo sin refrescar perfil (icono, nivel, summoner) antes de volver a llamar a account+summoner. */
export const RIOT_PROFILE_CACHE_MS = 3 * 24 * 60 * 60 * 1000;

const MATCH_SHOW = 4;

async function fetchBothQueues(
  token: string,
  puuid: string,
  platform: string,
  seasonYear: number
) {
  const [solo, flex] = await Promise.all([
    fetchSeasonRankedMatchesForQueue({
      token,
      puuid,
      platform,
      queue: 420,
      seasonYear,
      matchShow: MATCH_SHOW,
    }),
    fetchSeasonRankedMatchesForQueue({
      token,
      puuid,
      platform,
      queue: 440,
      seasonYear,
      matchShow: MATCH_SHOW,
    }),
  ]);
  return { solo, flex };
}

export async function refreshAllAccountsFromRiot(): Promise<{
  ok: boolean;
  updated: number;
  errors: string[];
}> {
  const token = getRiotApiKey();
  const accounts = listAccounts();
  if (!accounts.length) {
    return { ok: true, updated: 0, errors: [] };
  }
  if (!token) {
    return {
      ok: false,
      updated: 0,
      errors: ["RIOT_API_KEY no configurada"],
    };
  }

  const now = Date.now();
  const seasonYear = getPublicRankedSeasonYear();
  const errors: string[] = [];
  let updated = 0;
  const concurrency = refreshConcurrency();

  const needFull: AccountRow[] = [];
  const needLight: { account: AccountRow; prev: NonNullable<ReturnType<typeof getLatestSnapshot>> }[] =
    [];

  for (const a of accounts) {
    const prev = getLatestSnapshot(a.id);
    const staleProfile =
      !prev?.puuid ||
      prev.profile_fetched_at == null ||
      now - prev.profile_fetched_at > RIOT_PROFILE_CACHE_MS;
    if (staleProfile) needFull.push(a);
    else needLight.push({ account: a, prev: prev! });
  }

  let ddVersionDefault = "16.7.1";
  if (needFull.length > 0) {
    try {
      ddVersionDefault = await getLatestDdragonVersion();
    } catch {
      /* fallback */
    }
  }

  if (needFull.length > 0) {
    const players = needFull.map((a) => ({
      gameName: a.game_name,
      tagLine: a.tag_line,
    }));
    const hint = needFull[0]?.region_cluster || defaultRegionHint();
    const results = await resolvePlayersSimple(players, hint);

    const fullOut = await mapPool(needFull, concurrency, async (acc, i) => {
      const localErrs: string[] = [];
      const r = results[i] as MultiSearchPlayerResult | undefined;
      if (!r || r.error || !r.puuid) {
        localErrs.push(`${acc.game_name}#${acc.tag_line}: ${r?.error || "sin datos"}`);
        return { inserted: 0, errs: localErrs };
      }

      const platform = (r.platformId || acc.region_cluster || "euw1").toLowerCase();
      updateAccountRegionCluster(acc.id, platform);

      const { solo, flex } = await fetchBothQueues(token, r.puuid, platform, seasonYear);
      if (!solo.ok) {
        localErrs.push(
          `${acc.game_name}: partidas Solo ${solo.status} — ${solo.error?.slice(0, 80) || "error"}`
        );
      }
      if (!flex.ok) {
        localErrs.push(
          `${acc.game_name}: partidas Flex ${flex.status} — ${flex.error?.slice(0, 80) || "error"}`
        );
      }

      insertSnapshot(acc.id, {
        captured_at: now,
        profile_fetched_at: now,
        ddragon_version: ddVersionDefault,
        puuid: r.puuid,
        solo_rank: r.soloRank ?? "Unranked",
        flex_rank: r.flexRank ?? "Unranked",
        solo_icon_url: r.soloIconUrl ?? null,
        flex_icon_url: r.flexIconUrl ?? null,
        level: r.level,
        profile_icon_id: r.profileIconId,
        display_name: r.name,
        region_label: r.region,
        solo_wins: r.soloWins ?? null,
        solo_losses: r.soloLosses ?? null,
        flex_wins: r.flexWins ?? null,
        flex_losses: r.flexLosses ?? null,
        solo_matches_json: JSON.stringify(solo.ok ? solo.matches : []),
        flex_matches_json: JSON.stringify(flex.ok ? flex.matches : []),
        solo_streak_json: JSON.stringify(solo.ok ? solo.streak : null),
        flex_streak_json: JSON.stringify(flex.ok ? flex.streak : null),
      });
      return { inserted: 1, errs: localErrs };
    });

    for (const o of fullOut) {
      updated += o.inserted;
      errors.push(...o.errs);
    }
  }

  if (needLight.length > 0) {
    const lightOut = await mapPool(needLight, concurrency, async ({ account: acc, prev }) => {
      const localErrs: string[] = [];
      const platform = (acc.region_cluster || "euw1").toLowerCase();
      const puuid = prev.puuid as string;

      const league = await fetchLeagueEntriesByPuuid(puuid, platform);
      const { solo, flex } = await fetchBothQueues(token, puuid, platform, seasonYear);

      if (!solo.ok) {
        localErrs.push(
          `${acc.game_name}: partidas Solo ${solo.status} — ${solo.error?.slice(0, 80) || "error"}`
        );
      }
      if (!flex.ok) {
        localErrs.push(
          `${acc.game_name}: partidas Flex ${flex.status} — ${flex.error?.slice(0, 80) || "error"}`
        );
      }

      const soloRank = league ? (league.soloRank || "Unranked") : (prev.solo_rank || "Unranked");
      const flexRank = league ? (league.flexRank || "Unranked") : (prev.flex_rank || "Unranked");
      const soloIcon = league?.soloIconUrl ?? prev.solo_icon_url;
      const flexIcon = league?.flexIconUrl ?? prev.flex_icon_url;
      const soloWins = league ? league.soloWins : prev.solo_wins;
      const soloLosses = league ? league.soloLosses : prev.solo_losses;
      const flexWins = league ? league.flexWins : prev.flex_wins;
      const flexLosses = league ? league.flexLosses : prev.flex_losses;

      insertSnapshot(acc.id, {
        captured_at: now,
        profile_fetched_at: prev.profile_fetched_at ?? null,
        ddragon_version: prev.ddragon_version ?? ddVersionDefault,
        puuid,
        solo_rank: soloRank,
        flex_rank: flexRank,
        solo_icon_url: soloIcon,
        flex_icon_url: flexIcon,
        level: prev.level,
        profile_icon_id: prev.profile_icon_id,
        display_name: prev.display_name,
        region_label: prev.region_label,
        solo_wins: soloWins ?? null,
        solo_losses: soloLosses ?? null,
        flex_wins: flexWins ?? null,
        flex_losses: flexLosses ?? null,
        solo_matches_json: JSON.stringify(
          solo.ok ? solo.matches : parseStoredMatches(prev.solo_matches_json ?? null)
        ),
        flex_matches_json: JSON.stringify(
          flex.ok ? flex.matches : parseStoredMatches(prev.flex_matches_json ?? null)
        ),
        solo_streak_json: JSON.stringify(
          solo.ok ? solo.streak : parseStoredStreak(prev.solo_streak_json ?? null)
        ),
        flex_streak_json: JSON.stringify(
          flex.ok ? flex.streak : parseStoredStreak(prev.flex_streak_json ?? null)
        ),
      });
      return { inserted: 1, errs: localErrs };
    });

    for (const o of lightOut) {
      updated += o.inserted;
      errors.push(...o.errs);
    }
  }

  if (updated > 0) {
    try {
      writeAccountsSnapshotJson(now);
    } catch (e) {
      errors.push(
        `No se pudo escribir data/accounts-snapshot.json: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  /** Primer relleno: si aún no hay top campeones en SQLite, calcularlo y guardarlo (una sola vez por defecto). */
  if (updated > 0 && getChampionAggregateCache() === null) {
    const agg = await rebuildChampionAggregateCache(CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT);
    if (!agg.ok) {
      errors.push(`Top campeones (guardado tras refresco): ${agg.error}`);
    }
  }

  return { ok: true, updated, errors };
}

function parseStoredMatches(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseStoredStreak(raw: string | null): { wins: boolean; count: number } | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { wins?: boolean; count?: number };
    if (
      v &&
      typeof v.count === "number" &&
      typeof v.wins === "boolean" &&
      v.count > 0
    ) {
      return { wins: v.wins, count: v.count };
    }
    return null;
  } catch {
    return null;
  }
}

export function accountRowsToPlayers(accounts: AccountRow[]) {
  return accounts.map((a) => ({
    gameName: a.game_name,
    tagLine: a.tag_line,
  }));
}
