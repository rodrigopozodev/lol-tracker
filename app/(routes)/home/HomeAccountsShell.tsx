import DashboardNav from "@/components/layout/DashboardNav";
import { MultiSearchPlayerCard } from "@/components/multi/MultiSearchPlayerCard";
import type { AccountRow, AccountSnapshotRow } from "@/lib/db";
import type { PlayerResult } from "@/components/multi/MultiSearchPlayerCard";
import Link from "next/link";
import { RefreshAccountsButton } from "./RefreshAccountsButton";
import { RiotApiKeyPanel } from "./RiotApiKeyPanel";
import { RiotApiKeyExpiryTimer } from "./RiotApiKeyExpiryTimer";
import Script from "next/script";

type Row = {
  account: AccountRow;
  snap: AccountSnapshotRow | null;
  player: PlayerResult | null;
};

export function HomeAccountsShell({
  rows,
  lastUpdate,
  apiKeySavedAtMs,
  apiKeyFromEnv,
}: {
  rows: Row[];
  lastUpdate: number;
  apiKeySavedAtMs: number | null;
  apiKeyFromEnv: boolean;
}) {
  const updatedLabel =
    lastUpdate > 0
      ? new Date(lastUpdate).toLocaleString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <section className="relative z-10 mx-auto w-full max-w-none px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <DashboardNav />

          <div className="mt-6">
            <RiotApiKeyExpiryTimer savedAtMs={apiKeySavedAtMs} fromEnv={apiKeyFromEnv} />
          </div>

          <div className="mt-4">
            <RiotApiKeyPanel />
          </div>

          <div className="mt-10 space-y-8">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div>
                <h1 className="text-3xl font-bold text-white sm:text-4xl">Mis cuentas</h1>
                <p className="mt-1 max-w-2xl text-base text-[#B8A9C9]">
                  Ordenadas por partidas Solo/Duo (menos arriba, más abajo). Elige Solo/Duo o Flex para las
                  partidas recientes. Sin llamadas a Riot al abrir: datos desde SQLite. Última sync:{" "}
                  {updatedLabel}.{" "}
                  <Link href="/top-campeones" className="text-purple-400 hover:text-purple-300">
                    Top campeones agregado →
                  </Link>
                </p>
              </div>
              <RefreshAccountsButton />
            </div>

            <div className="flex w-full flex-col gap-2.5">
              {rows.map(({ account, snap, player }) => (
                <div key={account.id} className="flex w-full flex-col">
                  {player ? (
                    <div className="w-full">
                      <MultiSearchPlayerCard
                        player={player}
                        updatedAt={snap?.captured_at ?? null}
                        freezeRiotClientFetches
                      />
                    </div>
                  ) : (
                    <div className="w-full rounded-lg border border-amber-500/40 bg-[#1a0b2e] px-4 py-3 text-center text-sm text-amber-200">
                      Sin snapshot para{" "}
                      <strong>
                        {account.game_name}#{account.tag_line}
                      </strong>
                      . Pulsa &quot;Refrescar datos ahora&quot; o configura{" "}
                      <code className="text-purple-300">RIOT_API_KEY</code>.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Script
        id="adsense-home"
        strategy="afterInteractive"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7823702362685618"
        crossOrigin="anonymous"
      />
    </main>
  );
}
