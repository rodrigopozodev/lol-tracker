"use client";

import React, { useState, useEffect, useMemo } from "react";
import { championSquareUrl, profileIconUrl } from "@/lib/ddAssets";
import { parseRankText } from "@/lib/riot/rankTierScore";

/** Partidas/rachas servidas desde SQLite en /home (sin llamar a la API al cargar la página). */
export type HomeMatchCache = {
  ddragonVersion: string;
  soloMatches: unknown[];
  flexMatches: unknown[];
  soloStreak: { wins: boolean; count: number } | null;
  flexStreak: { wins: boolean; count: number } | null;
};

export type PlayerResult = {
  name: string;
  tag: string;
  region: string;
  platformId?: string | null;
  level: number | null;
  profileIconId: number | null;
  puuid?: string | null;
  soloRank?: string;
  flexRank?: string;
  soloIconUrl?: string | null;
  flexIconUrl?: string | null;
  soloWins?: number | null;
  soloLosses?: number | null;
  flexWins?: number | null;
  flexLosses?: number | null;
  error?: string;
  homeMatchCache?: HomeMatchCache;
};

/** CDN antiguo devuelve 403 para iconos nuevos; se usa la última versión publicada. */
let ddragonVersionMemo: string | null = null;
let ddragonVersionInflight: Promise<string> | null = null;

function loadLatestDdragonVersion(): Promise<string> {
  if (ddragonVersionMemo) return Promise.resolve(ddragonVersionMemo);
  if (!ddragonVersionInflight) {
    ddragonVersionInflight = fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then((r) => r.json())
      .then((arr: unknown) => {
        const v = Array.isArray(arr) && typeof arr[0] === "string" ? arr[0] : "16.7.1";
        ddragonVersionMemo = v;
        return v;
      })
      .catch(() => {
        ddragonVersionMemo = "16.7.1";
        return ddragonVersionMemo;
      });
  }
  return ddragonVersionInflight;
}

function formatRankedWinrateLine(
  wins: number | null | undefined,
  losses: number | null | undefined
): string | null {
  const w = typeof wins === "number" && wins >= 0 ? wins : 0;
  const l = typeof losses === "number" && losses >= 0 ? losses : 0;
  const total = w + l;
  if (total <= 0) return null;
  const pct = Math.round((w / total) * 1000) / 10;
  return `Winrate ${pct}% · ${w}V ${l}D`;
}

function normalizedProfileIconId(id: number | string | null | undefined): number | null {
  if (id == null || id === "") return null;
  const n = typeof id === "number" ? id : Number(id);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function sortMatchesByTimeDesc(a: Record<string, unknown>, b: Record<string, unknown>) {
  const ta =
    (a?.ts as number) ??
    (a?.gameEndTimestamp as number) ??
    (a?.gameCreation as number) ??
    (a?.endTime as number) ??
    (a?.timestamp as number) ??
    0;
  const tb =
    (b?.ts as number) ??
    (b?.gameEndTimestamp as number) ??
    (b?.gameCreation as number) ??
    (b?.endTime as number) ??
    (b?.timestamp as number) ??
    0;
  return tb - ta;
}

/** Racha actual (desde la partida más reciente). */
function streakFromSortedNewestFirst(matches: Record<string, unknown>[]): {
  text: string;
  wins: boolean;
} | null {
  const valid = matches.filter(
    (m) => m.remake !== true && typeof m.win === "boolean"
  );
  if (!valid.length) return null;
  const first = valid[0].win === true;
  let n = 0;
  for (const m of valid) {
    if ((m.win === true) === first) n++;
    else break;
  }
  if (n <= 0) return null;
  return {
    wins: first,
    text: first ? `${n}V` : `${n}D`,
  };
}

function apiStreakToBadge(s: { wins: boolean; count: number } | null | undefined): {
  text: string;
  wins: boolean;
} | null {
  if (!s || typeof s.count !== "number" || s.count <= 0) return null;
  return {
    wins: s.wins,
    text: s.wins ? `${s.count}V` : `${s.count}D`,
  };
}

/** Temporada clasificatoria 26 ≈ año calendario 2026 (UTC). Cambia con NEXT_PUBLIC_RANKED_SEASON_YEAR. */
const RANKED_SEASON_YEAR = (() => {
  const n = parseInt(process.env.NEXT_PUBLIC_RANKED_SEASON_YEAR || "2026", 10);
  return Number.isFinite(n) && n >= 2000 && n <= 2100 ? n : 2026;
})();

const MATCH_SHOW = 4;

/**
 * Retraso entre cuentas cuando se cargan partidas vía API en cliente (multisearch, etc.).
 * En /home ya no se usa: el historial viene de SQLite.
 */
export const MATCH_HISTORY_STAGGER_MS_PER_ACCOUNT = 6000;

export function MultiSearchPlayerCard({
  player,
  updatedAt,
  loadStaggerMs = 0,
  suppressClientFetches = false,
  freezeRiotClientFetches = false,
}: {
  player: PlayerResult;
  updatedAt?: number | null;
  /** Desplaza el inicio de las peticiones al usar `/api/riot/matches` en el cliente. */
  loadStaggerMs?: number;
  /**
   * Sin `fetch` a nuestra API, sin Data Dragon ni medallas OP.GG (búsqueda / multisearch).
   * Solo datos ya incluidos en `player` desde la respuesta inicial.
   */
  suppressClientFetches?: boolean;
  /**
   * /home: no pedir Riot ni `versions.json`; usar `player.homeMatchCache` y `ddragonVersion` guardada.
   */
  freezeRiotClientFetches?: boolean;
}) {
  const [tab, setTab] = useState<"solo" | "flex">(
    player.soloRank && player.soloRank !== "Unranked" ? "solo" : "flex"
  );
  const [soloMatches, setSoloMatches] = useState<unknown[]>(() =>
    freezeRiotClientFetches && player.homeMatchCache ? player.homeMatchCache.soloMatches : []
  );
  const [flexMatches, setFlexMatches] = useState<unknown[]>(() =>
    freezeRiotClientFetches && player.homeMatchCache ? player.homeMatchCache.flexMatches : []
  );
  const [soloStreakApi, setSoloStreakApi] = useState<{ wins: boolean; count: number } | null>(() =>
    freezeRiotClientFetches && player.homeMatchCache ? player.homeMatchCache.soloStreak : null
  );
  const [flexStreakApi, setFlexStreakApi] = useState<{ wins: boolean; count: number } | null>(() =>
    freezeRiotClientFetches && player.homeMatchCache ? player.homeMatchCache.flexStreak : null
  );
  const [ddVersion, setDdVersion] = useState(
    () => player.homeMatchCache?.ddragonVersion || "16.7.1"
  );
  const hasPuuid = typeof player.puuid === "string" && player.puuid.length > 0;

  useEffect(() => {
    if (freezeRiotClientFetches) return;
    if (suppressClientFetches) return;
    loadLatestDdragonVersion().then(setDdVersion);
  }, [freezeRiotClientFetches, suppressClientFetches]);

  useEffect(() => {
    if (!freezeRiotClientFetches) return;
    const c = player.homeMatchCache;
    if (!c) return;
    setDdVersion(c.ddragonVersion);
    setSoloMatches(c.soloMatches);
    setFlexMatches(c.flexMatches);
    setSoloStreakApi(c.soloStreak);
    setFlexStreakApi(c.flexStreak);
  }, [freezeRiotClientFetches, updatedAt, player.puuid, player.homeMatchCache]);

  useEffect(() => {
    if (suppressClientFetches || freezeRiotClientFetches) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async function load() {
        if (!hasPuuid) return;
        const p = encodeURIComponent(player.puuid as string);
        const plat =
          typeof player.platformId === "string" && player.platformId.length > 0
            ? `&platform=${encodeURIComponent(player.platformId)}`
            : "";
        const y = RANKED_SEASON_YEAR;
        const q = `puuid=${p}&queue=`;
        const base = `/api/riot/matches?${q}`;
        const tail = `&count=${MATCH_SHOW}&seasonYear=${y}${plat}`;

        async function applySolo(soloRes: Response) {
          const soloJson = await soloRes.json();
          if (cancelled) return;
          if (Array.isArray(soloJson?.matches)) setSoloMatches(soloJson.matches);
          else setSoloMatches([]);
          if (soloJson?.streak && typeof soloJson.streak.count === "number") {
            setSoloStreakApi(soloJson.streak);
          } else setSoloStreakApi(null);
        }

        async function applyFlex(flexRes: Response) {
          const flexJson = await flexRes.json();
          if (cancelled) return;
          if (Array.isArray(flexJson?.matches)) setFlexMatches(flexJson.matches);
          else setFlexMatches([]);
          if (flexJson?.streak && typeof flexJson.streak.count === "number") {
            setFlexStreakApi(flexJson.streak);
          } else setFlexStreakApi(null);
        }

        try {
          const soloRes = await fetch(`${base}420${tail}`, { cache: "no-store" });
          await applySolo(soloRes);
          const flexRes = await fetch(`${base}440${tail}`, { cache: "no-store" });
          await applyFlex(flexRes);
        } catch {
          if (!cancelled) {
            setSoloMatches([]);
            setFlexMatches([]);
            setSoloStreakApi(null);
            setFlexStreakApi(null);
          }
        }
      })();
    }, Math.max(0, loadStaggerMs));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [player.puuid, player.platformId, hasPuuid, loadStaggerMs, suppressClientFetches, freezeRiotClientFetches]);

  const profileIconNumeric = normalizedProfileIconId(player.profileIconId);

  const soloSorted = useMemo(
    () =>
      [...soloMatches].sort((a, b) =>
        sortMatchesByTimeDesc(a as Record<string, unknown>, b as Record<string, unknown>)
      ) as Record<string, unknown>[],
    [soloMatches]
  );
  const flexSorted = useMemo(
    () =>
      [...flexMatches].sort((a, b) =>
        sortMatchesByTimeDesc(a as Record<string, unknown>, b as Record<string, unknown>)
      ) as Record<string, unknown>[],
    [flexMatches]
  );

  const soloStreak = useMemo(() => {
    if (suppressClientFetches && !freezeRiotClientFetches) return null;
    const fromApi = apiStreakToBadge(soloStreakApi);
    if (fromApi) return fromApi;
    return streakFromSortedNewestFirst(soloSorted);
  }, [suppressClientFetches, freezeRiotClientFetches, soloStreakApi, soloSorted]);

  const flexStreak = useMemo(() => {
    if (suppressClientFetches && !freezeRiotClientFetches) return null;
    const fromApi = apiStreakToBadge(flexStreakApi);
    if (fromApi) return fromApi;
    return streakFromSortedNewestFirst(flexSorted);
  }, [suppressClientFetches, freezeRiotClientFetches, flexStreakApi, flexSorted]);

  const showProfileIconImg =
    profileIconNumeric != null && (!suppressClientFetches || freezeRiotClientFetches);
  const showRankMedalImgs = !suppressClientFetches || freezeRiotClientFetches;

  const selectedMatches = useMemo(
    () => (tab === "solo" ? soloSorted : flexSorted).slice(0, MATCH_SHOW),
    [tab, soloSorted, flexSorted]
  );
  const stripMatches = selectedMatches;

  const displayUpdated =
    typeof updatedAt === "number"
      ? new Date(updatedAt).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

  function streakPill(
    label: string,
    streak: { text: string; wins: boolean } | null
  ): React.ReactNode {
    if (!streak) {
      return (
        <span className="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-gray-500">
          Racha {label}: —
        </span>
      );
    }
    return (
      <span
        className={`rounded px-2.5 py-1.5 text-sm font-semibold ${
          streak.wins
            ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-200"
            : "border border-red-500/35 bg-red-500/15 text-red-200"
        }`}
        title={`Racha ${label}`}
      >
        Racha {label}: {streak.text}
      </span>
    );
  }

  function rankColumn(
    label: string,
    iconUrl: string | null | undefined,
    rankText: string | undefined,
    wins: number | null | undefined,
    losses: number | null | undefined,
    streak: { text: string; wins: boolean } | null
  ) {
    const parsed = parseRankText(rankText);
    const wrLine = formatRankedWinrateLine(wins, losses);
    const hasRank = iconUrl && rankText && rankText !== "Unranked";
    return (
      <div className="flex w-[min(100%,9rem)] shrink-0 flex-col items-center text-center sm:w-36">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
        {hasRank ? (
          <>
            {showRankMedalImgs ? (
              <img
                src={iconUrl || ""}
                alt={label}
                width={72}
                height={72}
                className="mt-1.5 h-[4.5rem] w-[4.5rem] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="mt-1.5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded border border-purple-500/25 bg-purple-900/20 text-xs text-purple-200">
                {label.slice(0, 1)}
              </div>
            )}
            <div className="mt-1.5 max-w-full truncate text-base font-semibold leading-tight text-white">
              {parsed.name}
            </div>
            {parsed.lp ? (
              <div className="text-sm leading-tight text-purple-200/90">{parsed.lp}</div>
            ) : null}
            {wrLine ? (
              <div className="mt-1.5 text-sm leading-snug text-[#c4b8d8]">{wrLine}</div>
            ) : null}
            <div className="mt-1.5 flex w-full justify-center">{streakPill(label, streak)}</div>
          </>
        ) : (
          <>
            <div className="mt-1.5 text-sm text-gray-500">Unranked</div>
            <div className="mt-1.5 flex w-full justify-center">{streakPill(label, streak)}</div>
          </>
        )}
      </div>
    );
  }

  function matchStrip(matches: Record<string, unknown>[]) {
    if (suppressClientFetches && !freezeRiotClientFetches) {
      return (
        <p className="max-w-[200px] text-sm leading-snug text-[#8a7a9a]">
          Sin historial en este modo.
        </p>
      );
    }
    if (matches.length === 0) {
      return (
        <p className="border-l border-white/10 pl-4 text-sm text-gray-500">
          Sin partidas {RANKED_SEASON_YEAR}
        </p>
      );
    }
    return (
      <div className="flex w-full flex-col gap-2 border-l border-white/10 pl-4">
        {matches.map((m) => {
          const win = m.win === true;
          const re = m.remake === true;
          const kda =
            typeof m.kills === "number" && typeof m.deaths === "number" && typeof m.assists === "number"
              ? `${m.kills}/${m.deaths}/${m.assists}`
              : null;
          const lobbyTier =
            typeof m.lobbyAvgTierLabel === "string" && m.lobbyAvgTierLabel.length > 0
              ? m.lobbyAvgTierLabel
              : null;
          return (
            <div
              key={String(m.id)}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              title={re ? "Remake" : win ? "Victoria" : "Derrota"}
            >
              <img
                src={championSquareUrl(ddVersion, (m.champion as string) || "Unknown")}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-md border border-white/10 object-cover sm:h-11 sm:w-11"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-semibold ${
                    re ? "text-slate-400" : win ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {re ? "Remake" : win ? "Victoria" : "Derrota"}
                </div>
                {kda ? (
                  <div
                    className={`mt-0.5 font-mono text-sm ${
                      re ? "text-slate-400" : win ? "text-sky-300" : "text-rose-300"
                    }`}
                  >
                    {kda}
                  </div>
                ) : null}
              </div>
              <div
                className="shrink-0 text-right"
                title="Media del tier en la misma cola que la partida (datos de league al refrescar; no es el rango histórico exacto del día de la partida). Cuentan solo jugadores con liga en esa cola."
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Tier Ø
                </div>
                <div className="mt-0.5 text-sm font-bold leading-tight text-purple-200">
                  {lobbyTier ?? "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const showMatchQueueToggle = freezeRiotClientFetches || !suppressClientFetches;

  return (
    <div className="w-full rounded-xl border border-purple-500/25 bg-[#151022] px-4 py-4 shadow-md sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap sm:gap-5">
        {/* Identidad */}
        <div className="flex min-w-0 shrink-0 gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-purple-900/30 sm:h-[4.25rem] sm:w-[4.25rem]">
            {showProfileIconImg ? (
              <img
                alt=""
                src={profileIconUrl(ddVersion, profileIconNumeric!)}
                width={68}
                height={68}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).onerror = null;
                  (e.currentTarget as HTMLImageElement).src = profileIconUrl(ddVersion, 0);
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-purple-900/50 text-lg text-purple-300">
                {suppressClientFetches && !freezeRiotClientFetches && player.name
                  ? player.name.charAt(0).toUpperCase()
                  : "?"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold leading-tight text-white sm:text-xl">
              {player.name}
              <span className="text-purple-300">#{player.tag}</span>
            </div>
            <div className="text-sm text-gray-400 sm:text-base">
              {player.region} · Lv {player.level}
            </div>
            <div className="text-xs text-gray-600 sm:text-sm">{displayUpdated}</div>
          </div>
        </div>

        {/* Solo (racha debajo) | Flex (racha debajo) | partidas */}
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4 sm:flex-nowrap sm:gap-5">
          <div className="flex shrink-0 flex-col gap-3 border-white/10 sm:border-r sm:pr-5">
            <div className="flex items-start justify-center gap-4 sm:justify-start sm:gap-5">
              {rankColumn(
                "Solo",
                player.soloIconUrl,
                player.soloRank,
                player.soloWins,
                player.soloLosses,
                soloStreak
              )}
              {rankColumn(
                "Flex",
                player.flexIconUrl,
                player.flexRank,
                player.flexWins,
                player.flexLosses,
                flexStreak
              )}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
            {showMatchQueueToggle ? (
              <div className="flex flex-wrap items-center gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() => setTab("solo")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    tab === "solo" ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400"
                  }`}
                >
                  Partidas Solo/Duo
                </button>
                <button
                  type="button"
                  onClick={() => setTab("flex")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    tab === "flex" ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400"
                  }`}
                >
                  Partidas Flex
                </button>
              </div>
            ) : null}
            <div className="flex min-h-[5.5rem] min-w-0 flex-1 items-center sm:items-start">
              {matchStrip(stripMatches as Record<string, unknown>[])}
            </div>
          </div>
        </div>
      </div>
      {freezeRiotClientFetches ? (
        <p className="mt-3 border-t border-white/5 pt-3 text-sm text-gray-600">
          Caché · temporada {RANKED_SEASON_YEAR} · cola: {tab === "solo" ? "Solo/Duo" : "Flex"}. Tier Ø: media por
          partida según league al refrescar (no el rango del momento exacto de la partida). Sin liga en esa cola → no
          entra en la media. Refresca cuentas para rellenar este dato.
        </p>
      ) : null}
    </div>
  );
}
