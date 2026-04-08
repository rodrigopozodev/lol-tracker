import { unstable_noStore as noStore } from "next/cache";
import { getDb, listAccounts, getLatestSnapshot, type AccountSnapshotRow } from "@/lib/db";
import { snapshotToPlayer } from "@/lib/mapHomePlayers";
import { getRiotApiKeySavedAtMs, usesRiotApiKeyFromEnv } from "@/lib/riotApiKey";
import { HomeAccountsShell } from "./HomeAccountsShell";

/** SQLite cambia tras refrescar; sin esto Next/CDN puede servir HTML/RSC antiguo y verás “Sin snapshot” pese al mensaje de éxito. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function soloQueueTotalGames(snap: AccountSnapshotRow | null): number {
  if (!snap) return 0;
  const w = snap.solo_wins ?? 0;
  const l = snap.solo_losses ?? 0;
  const n = w + l;
  return n >= 0 ? n : 0;
}

export default async function HomePage() {
  noStore();
  getDb();
  const accounts = listAccounts();
  const snaps = accounts.map((a) => getLatestSnapshot(a.id));

  const rows = accounts
    .map((a, i) => ({
      account: a,
      snap: snaps[i],
      player: snapshotToPlayer(a, snaps[i]),
    }))
    .sort((a, b) => {
      const ga = soloQueueTotalGames(a.snap);
      const gb = soloQueueTotalGames(b.snap);
      if (ga !== gb) return ga - gb;
      return a.account.sort_order - b.account.sort_order;
    });

  const lastUpdate = Math.max(0, ...snaps.map((s) => s?.captured_at ?? 0));

  return (
    <HomeAccountsShell
      rows={rows}
      lastUpdate={lastUpdate}
      apiKeySavedAtMs={getRiotApiKeySavedAtMs()}
      apiKeyFromEnv={usesRiotApiKeyFromEnv()}
    />
  );
}
