import type { AccountRow, AccountSnapshotRow } from "@/lib/db";
import type { HomeMatchCache, PlayerResult } from "@/components/multi/MultiSearchPlayerCard";

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseStreak(raw: string | null | undefined): { wins: boolean; count: number } | null {
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

function buildHomeMatchCache(snap: AccountSnapshotRow): HomeMatchCache {
  const dd = snap.ddragon_version?.trim() || "16.7.1";
  return {
    ddragonVersion: dd,
    soloMatches: parseJsonArray(snap.solo_matches_json ?? null),
    flexMatches: parseJsonArray(snap.flex_matches_json ?? null),
    soloStreak: parseStreak(snap.solo_streak_json),
    flexStreak: parseStreak(snap.flex_streak_json),
  };
}

export function snapshotToPlayer(
  account: AccountRow,
  snap: AccountSnapshotRow | null
): PlayerResult | null {
  if (!snap?.puuid) return null;
  return {
    name: snap.display_name || account.game_name,
    tag: account.tag_line,
    region: snap.region_label || "EUW",
    platformId: account.region_cluster || null,
    level: snap.level,
    profileIconId: snap.profile_icon_id,
    puuid: snap.puuid,
    soloRank: snap.solo_rank || "Unranked",
    flexRank: snap.flex_rank || "Unranked",
    soloIconUrl: snap.solo_icon_url,
    flexIconUrl: snap.flex_icon_url,
    soloWins: snap.solo_wins,
    soloLosses: snap.solo_losses,
    flexWins: snap.flex_wins,
    flexLosses: snap.flex_losses,
    homeMatchCache: buildHomeMatchCache(snap),
  };
}
