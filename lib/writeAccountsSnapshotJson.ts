import fs from "fs";
import path from "path";
import { getLatestSnapshot, listAccounts } from "@/lib/db";

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Copia legible de los últimos snapshots en `data/accounts-snapshot.json`
 * (además de SQLite). Se escribe tras cada refresco exitoso.
 */
export function writeAccountsSnapshotJson(refreshedAt: number): void {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const accounts = listAccounts();
  const payload = {
    refreshedAt,
    refreshedAtIso: new Date(refreshedAt).toISOString(),
    accounts: accounts.map((a) => {
      const snap = getLatestSnapshot(a.id);
      if (!snap) {
        return {
          game_name: a.game_name,
          tag_line: a.tag_line,
          region_cluster: a.region_cluster,
          snapshot: null,
        };
      }
      return {
        game_name: a.game_name,
        tag_line: a.tag_line,
        region_cluster: a.region_cluster,
        snapshot: {
          captured_at: snap.captured_at,
          puuid: snap.puuid,
          display_name: snap.display_name,
          region_label: snap.region_label,
          level: snap.level,
          profile_icon_id: snap.profile_icon_id,
          ddragon_version: snap.ddragon_version,
          solo_rank: snap.solo_rank,
          flex_rank: snap.flex_rank,
          solo_wins: snap.solo_wins,
          solo_losses: snap.solo_losses,
          flex_wins: snap.flex_wins,
          flex_losses: snap.flex_losses,
          solo_matches: parseJson(snap.solo_matches_json ?? null),
          flex_matches: parseJson(snap.flex_matches_json ?? null),
          solo_streak: parseJson(snap.solo_streak_json ?? null),
          flex_streak: parseJson(snap.flex_streak_json ?? null),
        },
      };
    }),
  };

  fs.writeFileSync(path.join(dir, "accounts-snapshot.json"), JSON.stringify(payload, null, 2), "utf8");
}
