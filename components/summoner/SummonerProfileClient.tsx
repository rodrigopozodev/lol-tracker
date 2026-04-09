"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDdragonVersion } from "@/hooks/useDdragonVersion";
import RankSwitcher from "@/components/summoner/RankSwitcher";
import ProfileIcon from "@/components/summoner/ProfileIcon";
import ProfileLoadingSkeleton from "@/components/summoner/ProfileLoadingSkeleton";
import { formatEsDateTime } from "@/lib/formatEsDateTime";
import type { RiotPlatformId } from "@/lib/riot/platforms";
import ApiErrorPanel from "@/components/summoner/ApiErrorPanel";
import { parseErrorBody, userFacingApiError } from "@/lib/userFacingApiError";
import { addRecentSummonerSearch, rememberTypeaheadResults } from "@/lib/summonerSearchHistory";

type LeagueEntry = {
  tier?: string | null;
  rank?: string | null;
  leaguePoints?: number | null;
  wins?: number | null;
  losses?: number | null;
};

type AccountJson = {
  puuid: string;
  gameName: string;
  tagLine: string;
  name: string | null;
  summonerLevel: number | null;
  profileIconId: number | null;
  region: string | null;
};

type MatchRow = {
  id: string;
  ts: number | null;
  queueLabel: string;
  durationSec: number | null;
  champion: string | null;
  championImageKey?: string | null;
  win: boolean;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  kda: number | null;
};

type MasteryRow = {
  championName: string | null;
  championImageKey?: string | null;
  championAlias?: string | null;
  championLevel: number | null;
  championPoints: number;
};

type DetailErrors = {
  league?: string;
  matches?: string;
  masteries?: string;
};

function profileIconUrl(id: number | null, version: string): string | null {
  if (id == null) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${id}.png`;
}

function champSquare(ddragonKey: string, version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${encodeURIComponent(ddragonKey)}.png`;
}

function PartialWarning({ text }: { text: string }) {
  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/95"
    >
      {text}
    </div>
  );
}

export default function SummonerProfileClient({
  platform,
  gameName,
  tagLine,
}: {
  platform: RiotPlatformId;
  gameName: string;
  tagLine: string;
}) {
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [fatalError, setFatalError] = useState<{ message: string; retryable: boolean } | null>(
    null
  );
  const [account, setAccount] = useState<AccountJson | null>(null);
  const [solo, setSolo] = useState<LeagueEntry | null>(null);
  const [flex, setFlex] = useState<LeagueEntry | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [masteries, setMasteries] = useState<MasteryRow[]>([]);
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({});
  const ddVersion = useDdragonVersion();

  const load = useCallback(async () => {
    setFatalError(null);
    setDetailErrors({});
    setLoadingAccount(true);
    setAccount(null);
    setSolo(null);
    setFlex(null);
    setMatches([]);
    setMasteries([]);

    const accUrl = `/api/riot/account?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&platform=${encodeURIComponent(platform)}`;

    try {
      const accRes = await fetch(accUrl, { cache: "no-store" });
      if (!accRes.ok) {
        const errBody = await parseErrorBody(accRes);
        const { message, retryable } = userFacingApiError(accRes.status, errBody.error);
        setFatalError({ message, retryable });
        return;
      }

      const acc: AccountJson = await accRes.json();
      setAccount(acc);
      addRecentSummonerSearch(`${acc.gameName}#${acc.tagLine}`, platform);
      setLoadingAccount(false);
      setLoadingDetails(true);

      const puuid = acc.puuid;
      const plat = encodeURIComponent(platform);
      const leagueUrl = `/api/riot/league?puuid=${encodeURIComponent(puuid)}&platform=${plat}`;
      const matchesUrl = `/api/riot/matches?puuid=${encodeURIComponent(puuid)}&platform=${plat}&count=15`;
      const masteriesUrl = `/api/riot/masteries?puuid=${encodeURIComponent(puuid)}&platform=${plat}&count=6`;

      const [lr, mr, mast] = await Promise.all([
        fetch(leagueUrl, { cache: "no-store" }),
        fetch(matchesUrl, { cache: "no-store" }),
        fetch(masteriesUrl, { cache: "no-store" }),
      ]);

      const nextErr: DetailErrors = {};

      if (lr.ok) {
        const lj = await lr.json();
        setSolo((lj?.solo as LeagueEntry) || null);
        setFlex((lj?.flex as LeagueEntry) || null);
      } else {
        const b = await parseErrorBody(lr);
        nextErr.league = userFacingApiError(lr.status, b.error).message;
        setSolo(null);
        setFlex(null);
      }

      if (mr.ok) {
        const mj = await mr.json();
        setMatches(Array.isArray(mj?.matches) ? mj.matches : []);
      } else {
        const b = await parseErrorBody(mr);
        nextErr.matches = userFacingApiError(mr.status, b.error).message;
        setMatches([]);
      }

      if (mast.ok) {
        const sj = await mast.json();
        setMasteries(Array.isArray(sj?.masteries) ? sj.masteries : []);
      } else {
        const b = await parseErrorBody(mast);
        nextErr.masteries = userFacingApiError(mast.status, b.error).message;
        setMasteries([]);
      }

      setDetailErrors(nextErr);
    } catch {
      setFatalError({
        message: "No se pudo conectar. Comprueba tu red e inténtalo de nuevo.",
        retryable: true,
      });
    } finally {
      setLoadingAccount(false);
      setLoadingDetails(false);
    }
  }, [platform, gameName, tagLine]);

  useEffect(() => {
    if (!account) return;
    rememberTypeaheadResults([
      {
        riotIdLine: `${account.gameName}#${account.tagLine}`,
        platform,
        profileIconUrl: profileIconUrl(account.profileIconId, ddVersion),
        suggestSource: "riot",
      },
    ]);
  }, [account, ddVersion, platform]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadingAccount && !account) {
    return <ProfileLoadingSkeleton />;
  }

  if (fatalError) {
    return (
      <ApiErrorPanel
        message={fatalError.message}
        retryable={fatalError.retryable}
        onRetry={fatalError.retryable ? load : undefined}
        backHref="/"
        backLabel="Volver al buscador"
      />
    );
  }

  if (!account) {
    return (
      <ApiErrorPanel
        message="No se pudo cargar el perfil."
        retryable
        onRetry={load}
        backHref="/"
        backLabel="Volver al buscador"
      />
    );
  }

  const icon = profileIconUrl(account.profileIconId, ddVersion);
  const resolvedPlatform = (account.region || platform) as RiotPlatformId;
  const warnLines = [detailErrors.league, detailErrors.matches, detailErrors.masteries].filter(
    Boolean
  ) as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      {warnLines.length > 0 ? (
        <div className="mb-6 space-y-2">
          {warnLines.map((t, i) => (
            <PartialWarning key={`${i}-${t.slice(0, 24)}`} text={t} />
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-md sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-primary/30">
            <ProfileIcon src={icon} size={112} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl font-bold text-foreground sm:text-2xl">
              {account.gameName}
              <span className="text-primary">#{account.tagLine}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {resolvedPlatform} · Nivel {account.summonerLevel ?? "—"}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-center border-t border-border pt-6 sm:mt-8 sm:pt-8">
          {loadingDetails ? (
            <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground" aria-live="polite">
              <span
                className="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
                aria-hidden
              />
              <span className="text-sm">Cargando ranked e historial…</span>
            </div>
          ) : (
            <RankSwitcher solo={solo} flex={flex} />
          )}
        </div>
      </div>

      {!loadingDetails && !detailErrors.masteries && masteries.length > 0 ? (
        <section className="mt-8 sm:mt-10">
          <h2 className="mb-3 text-base font-semibold text-foreground sm:text-lg">Maestrías principales</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {masteries.map((m, i) => (
              <li
                key={`${m.championName}-${i}`}
                className="flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              >
                {m.championName ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={champSquare(m.championImageKey ?? m.championAlias ?? m.championName, ddVersion)}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-md"
                  />
                ) : null}
                <span className="min-w-0 truncate">
                  {m.championName ?? "—"} · M{m.championLevel ?? "?"} ·{" "}
                  {(m.championPoints / 1000).toFixed(0)}k
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!loadingDetails && detailErrors.masteries ? (
        <p className="mt-8 text-sm text-muted-foreground">{detailErrors.masteries}</p>
      ) : null}

      <section className="mt-8 sm:mt-10">
        <h2 className="mb-3 text-base font-semibold text-foreground sm:text-lg">Historial reciente</h2>
        {loadingDetails ? (
          <div className="space-y-2" aria-hidden>
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="h-[4.25rem] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : matches.length === 0 && detailErrors.matches ? (
          <p className="text-sm text-muted-foreground">{detailErrors.matches}</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay partidas recientes para mostrar.</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/summoner/${resolvedPlatform}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/match/${encodeURIComponent(m.id)}?puuid=${encodeURIComponent(account.puuid)}`}
                  className={`flex min-h-[3.5rem] flex-wrap items-center gap-2 rounded-xl border px-3 py-3 transition active:opacity-90 sm:gap-3 ${
                    m.win
                      ? "border-emerald-600/35 bg-emerald-50"
                      : "border-red-500/35 bg-red-50"
                  }`}
                >
                  {m.champion ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={champSquare(m.championImageKey ?? m.champion, ddVersion)}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 shrink-0 rounded-lg"
                    />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground sm:text-base">
                      {m.queueLabel}
                      {m.win ? (
                        <span className="ml-2 font-medium text-emerald-400">Victoria</span>
                      ) : (
                        <span className="ml-2 font-medium text-red-400">Derrota</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-sm">
                      {m.champion ?? "—"} · {m.kills}/{m.deaths}/{m.assists}
                      {m.kda != null ? ` · KDA ${m.kda.toFixed(2)}` : ""}
                      {m.durationSec != null ? ` · ${Math.floor(m.durationSec / 60)}′` : ""}
                    </div>
                  </div>
                  <div className="w-full shrink-0 text-xs text-muted-foreground/75 sm:w-auto sm:text-right">
                    {m.ts != null ? formatEsDateTime(m.ts) : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
