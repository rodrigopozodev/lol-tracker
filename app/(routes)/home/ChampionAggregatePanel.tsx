"use client";

import { useCallback, useEffect, useState } from "react";

import { formatEsDateTime } from "@/lib/formatEsDateTime";

export type ChampionAggregateBootstrap = {
  computedAt: number;
  seasonYear: number;
  queues: string[];
  perAccountMaxDetailCalls: number;
  truncated: boolean;
  accountNotes: {
    label: string;
    detailCalls: number;
    truncated: boolean;
    skipped?: string;
  }[];
  errors: string[];
  top: {
    rank: number;
    champion: string;
    championId: number | null;
    iconUrl: string | null;
    games: number;
    wins: number;
    losses: number;
    winRate: number;
  }[];
};

type ApiPayload = ChampionAggregateBootstrap & {
  source?: "none" | "cache" | "riot";
  error?: string;
  durationMs?: number;
  confirmMessage?: string;
};

function formatComputedAt(ms: number) {
  return formatEsDateTime(ms);
}

export function ChampionAggregatePanel({
  initial,
}: {
  initial: ChampionAggregateBootstrap | null;
}) {
  const [data, setData] = useState<ChampionAggregateBootstrap | null>(initial);
  const [source, setSource] = useState<"server" | "none" | "cache" | "riot">(
    initial ? "server" : "none"
  );
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    setData(initial);
    setSource(initial ? "server" : "none");
  }, [initial?.computedAt]);

  const refreshFromRiot = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setDoneMessage(null);
    try {
      const perAccount =
        data?.perAccountMaxDetailCalls && data.perAccountMaxDetailCalls >= 10
          ? data.perAccountMaxDetailCalls
          : 55;
      const res = await fetch("/api/home/champion-aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perAccount }),
      });
      const json = (await res.json()) as ApiPayload;
      if (!res.ok) {
        setFetchError(json.error || `Error ${res.status}`);
        return;
      }
      const { source: _s, error: _e, durationMs: _d, confirmMessage: _c, ...rest } = json;
      setData({
        computedAt: json.computedAt ?? Date.now(),
        seasonYear: rest.seasonYear,
        queues: rest.queues,
        perAccountMaxDetailCalls: rest.perAccountMaxDetailCalls,
        truncated: rest.truncated,
        accountNotes: rest.accountNotes,
        errors: rest.errors,
        top: rest.top,
      });
      setSource("riot");
      const msg =
        json.confirmMessage ||
        (typeof json.durationMs === "number"
          ? `Actualización completada en ${json.durationMs} ms. Caché guardada.`
          : "Actualización completada. Caché guardada en SQLite.");
      setDoneMessage(msg);
      if (typeof window !== "undefined") {
        console.info(
          `[champion-aggregate] ${msg}`,
          json.top?.find((r) => r.champion === "Xin Zhao")
            ? `Xin Zhao: ${JSON.stringify(json.top.find((r) => r.champion === "Xin Zhao"))}`
            : "Xin Zhao no está en el top 15 por volumen de partidas ranked."
        );
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, [data?.perAccountMaxDetailCalls]);

  const computedAt = data?.computedAt ?? null;
  const showTable = data && (data.top.length > 0 || source === "riot" || source === "server");

  return (
    <section className="rounded-2xl border border-purple-500/35 bg-[#150828] p-6 shadow-lg shadow-purple-950/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Top campeones (todas las cuentas)</h2>
          <p className="mt-1 text-sm text-[#B8A9C9]">
            Solo/Duo y Flex de la temporada actual. Los datos guardados en SQLite se muestran al cargar la
            página; solo al pulsar el botón se vuelve a consultar Riot y se actualiza la caché.
          </p>
          <p className="mt-2 text-xs text-amber-200/90">
            Límite de partidas revisadas por cuenta en cada actualización (rate limits). Si hace falta más
            precisión, sube el valor con la query del POST o ampliando el cuerpo en el futuro.
          </p>
          {computedAt ? (
            <p className="mt-2 text-xs text-[#7d6f92]">
              Caché local: {formatComputedAt(computedAt)}
              {source === "server" || source === "cache"
                ? " · sin llamadas a Riot en esta carga"
                : source === "riot"
                  ? " · recién actualizado con Riot"
                  : ""}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#7d6f92]">
              Sin caché de top campeones todavía. Pulsa «Actualizar con Riot API» cuando quieras generarla
              (gasta cuota de API).
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={refreshFromRiot}
          disabled={loading}
          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {loading ? "Consultando Riot…" : "Actualizar con Riot API"}
        </button>
      </div>

      {fetchError ? (
        <p className="mt-4 text-sm text-red-300">{fetchError}</p>
      ) : null}

      {doneMessage && !loading ? (
        <div
          className="mt-4 rounded-lg border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
          role="status"
        >
          <p className="font-medium">{doneMessage}</p>
          <p className="mt-1 text-xs text-emerald-200/85">
            Ranked Solo/Duo + Flex, temporada actual, sumando todas las cuentas. Mira la consola del servidor
            donde corre Next: líneas <code className="text-emerald-300/95">[champion-aggregate]</code> con tiempo
            y, si aplica, Xin Zhao agregado.
          </p>
        </div>
      ) : null}

      {showTable && data ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs text-[#9a8fb0]">
            Temporada {data.seasonYear} · hasta {data.perAccountMaxDetailCalls} detalles de partida por
            cuenta · {data.queues.join(", ")}
            {data.truncated ? " · algunas cuentas llegaron al límite antes de agotar el historial" : ""}
          </p>

          {data.errors.length > 0 ? (
            <ul className="list-inside list-disc text-sm text-amber-200">
              {data.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[320px] text-left text-sm text-[#e8dff5]">
              <thead className="bg-black/30 text-xs uppercase tracking-wide text-[#B8A9C9]">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Campeón</th>
                  <th className="px-3 py-2 text-right">Partidas</th>
                  <th className="px-3 py-2 text-right">W / L</th>
                  <th className="px-3 py-2 text-right">WR</th>
                </tr>
              </thead>
              <tbody>
                {data.top.map((row) => {
                  const highlight = row.rank <= 5;
                  return (
                    <tr
                      key={`${row.rank}-${row.champion}`}
                      className={
                        highlight
                          ? "border-l-2 border-l-amber-400/90 bg-amber-500/10"
                          : "border-l-2 border-l-transparent"
                      }
                    >
                      <td className="px-3 py-2 font-mono text-[#B8A9C9]">{row.rank}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-2">
                          {row.iconUrl ? (
                            <img
                              src={row.iconUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-md border border-white/10 bg-black/40"
                            />
                          ) : null}
                          <span className={highlight ? "font-semibold text-white" : ""}>
                            {row.champion}
                            {highlight ? (
                              <span className="ml-2 text-xs font-normal text-amber-200/90">top 5</span>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.games}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-[#B8A9C9]">
                        {row.wins} / {row.losses}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-300/95">
                        {row.winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.top.length === 0 ? (
            <p className="text-sm text-[#B8A9C9]">
              No hubo partidas clasificatorias en el tramo analizado (o la caché está vacía).
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
