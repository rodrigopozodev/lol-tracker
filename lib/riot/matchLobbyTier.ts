import { mapPool } from "@/lib/promisePool";
import { fetchLeagueEntriesJsonOnShard, tierScoreForQueueFromEntries } from "@/lib/riot/leagueEntriesShard";
import { tierScoreToAvgLabel } from "@/lib/riot/rankTierScore";

export type MatchWithLobbyPuuids = {
  participantPuuids?: string[];
  lobbyAvgTierLabel?: string | null;
};

/**
 * Media de tier (Solo o Flex) de los participantes que tengan liga en esa cola.
 * Deduplica PUUID entre partidas para no repetir llamadas a league-v4.
 */
export async function enrichMatchesWithLobbyAvgTier(
  matches: MatchWithLobbyPuuids[],
  platformShard: string,
  token: string,
  queue: number
): Promise<void> {
  if (matches.length === 0) return;
  const queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" =
    queue === 440 ? "RANKED_FLEX_SR" : "RANKED_SOLO_5x5";

  const all = new Set<string>();
  for (const m of matches) {
    for (const p of m.participantPuuids ?? []) {
      if (typeof p === "string" && p.length > 0) all.add(p);
    }
  }
  if (all.size === 0) {
    for (const m of matches) {
      m.lobbyAvgTierLabel = null;
      delete m.participantPuuids;
    }
    return;
  }

  const puuids = [...all];
  const tierByPuuid = new Map<string, number | null>();

  await mapPool(puuids, 3, async (puuid) => {
    const ent = await fetchLeagueEntriesJsonOnShard(puuid, platformShard, token);
    const score = tierScoreForQueueFromEntries(ent, queueType);
    tierByPuuid.set(puuid, score);
  });

  for (const m of matches) {
    const scores: number[] = [];
    for (const p of m.participantPuuids ?? []) {
      const s = tierByPuuid.get(p);
      if (typeof s === "number") scores.push(s);
    }
    m.lobbyAvgTierLabel =
      scores.length > 0
        ? tierScoreToAvgLabel(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
    delete m.participantPuuids;
  }
}
