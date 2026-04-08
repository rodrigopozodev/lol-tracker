import { riotFetch } from "@/lib/riot/riotFetch";
import { rankStringToTierScore } from "@/lib/riot/rankTierScore";

export async function fetchLeagueEntriesJsonOnShard(
  puuid: string,
  platformShard: string,
  token: string
): Promise<Record<string, unknown>[] | null> {
  const shard = platformShard.toLowerCase().trim();
  if (!shard) return null;
  const url = `https://${shard}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
  try {
    const res = await riotFetch(url, token);
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j) ? (j as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

export function tierScoreForQueueFromEntries(
  entries: Record<string, unknown>[] | null | undefined,
  queueType: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR"
): number | null {
  if (!entries?.length) return null;
  const e = entries.find((x) => x.queueType === queueType);
  if (!e) return null;
  const tier = (e.tier as string) || "";
  const rank = (e.rank as string) || "";
  const s = `${tier} ${rank}`.trim();
  return rankStringToTierScore(s);
}
