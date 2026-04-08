import { getRiotApiKey } from "@/lib/riotApiKey";
import { riotFetch } from "@/lib/riot/riotFetch";
import { CLUSTERS } from "@/lib/riot/multiSearchCore";

function normalizeRank(entry: Record<string, unknown> | null): string | null {
  if (!entry) return null;
  const tier = (entry.tier as string) || "";
  const rank = (entry.rank as string) || "";
  const lp =
    typeof entry.leaguePoints === "number" ? `${entry.leaguePoints} LP` : "";
  const base = `${tier} ${rank}`.trim();
  return lp ? `${base} ${lp}` : base || null;
}

export type LeagueRankBundle = {
  soloRank: string | null;
  flexRank: string | null;
  soloIconUrl: string | null;
  flexIconUrl: string | null;
  soloWins: number | null;
  soloLosses: number | null;
  flexWins: number | null;
  flexLosses: number | null;
};

/** Entradas clasificatorias por PUUID (sin account-v1 ni summoner-v4). */
export async function fetchLeagueEntriesByPuuid(
  puuid: string,
  preferredCluster: string
): Promise<LeagueRankBundle | null> {
  const token = getRiotApiKey();
  if (!token) return null;

  const pref = preferredCluster?.toLowerCase().trim() || "";
  const order =
    pref && CLUSTERS.includes(pref) ? [pref, ...CLUSTERS.filter((c) => c !== pref)] : [...CLUSTERS];

  let entries: Record<string, unknown>[] | null = null;
  let gotOk = false;
  for (const cluster of order) {
    try {
      const url = `https://${cluster}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
      const res = await riotFetch(url, token);
      if (res.ok) {
        entries = await res.json();
        gotOk = true;
        break;
      }
    } catch {
      /* siguiente */
    }
  }

  if (!gotOk || !entries || !Array.isArray(entries)) {
    return null;
  }

  const normalized = entries
    .filter((e) => e && (e as { queueType?: string }).queueType)
    .map((e) => ({
      queue: (e as { queueType: string }).queueType,
      tier: (e as { tier: string }).tier,
      rank: (e as { rank: string }).rank,
      leaguePoints: (e as { leaguePoints: number }).leaguePoints,
      wins: (e as { wins: number }).wins,
      losses: (e as { losses: number }).losses,
    }));

  const solo = normalized.find((x) => x.queue === "RANKED_SOLO_5x5") || null;
  const flex = normalized.find((x) => x.queue === "RANKED_FLEX_SR") || null;

  let soloRank: string | null = null;
  let flexRank: string | null = null;
  let soloIconUrl: string | null = null;
  let flexIconUrl: string | null = null;
  let soloWins: number | null = null;
  let soloLosses: number | null = null;
  let flexWins: number | null = null;
  let flexLosses: number | null = null;

  if (solo) {
    soloRank = normalizeRank(solo);
    if (typeof solo.wins === "number") soloWins = solo.wins;
    if (typeof solo.losses === "number") soloLosses = solo.losses;
    if (solo.tier) {
      soloIconUrl = `https://opgg-static.akamaized.net/images/medals_new/${String(solo.tier).toLowerCase()}.png`;
    }
  }
  if (flex) {
    flexRank = normalizeRank(flex);
    if (typeof flex.wins === "number") flexWins = flex.wins;
    if (typeof flex.losses === "number") flexLosses = flex.losses;
    if (flex.tier) {
      flexIconUrl = `https://opgg-static.akamaized.net/images/medals_new/${String(flex.tier).toLowerCase()}.png`;
    }
  }

  return {
    soloRank,
    flexRank,
    soloIconUrl,
    flexIconUrl,
    soloWins,
    soloLosses,
    flexWins,
    flexLosses,
  };
}
