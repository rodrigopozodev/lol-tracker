"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDdragonVersion } from "@/hooks/useDdragonVersion";
import ApiErrorPanel from "@/components/summoner/ApiErrorPanel";
import MatchLoadingSkeleton from "@/components/summoner/MatchLoadingSkeleton";
import { formatEsDateTime } from "@/lib/formatEsDateTime";
import type { RiotPlatformId } from "@/lib/riot/platforms";
import { parseErrorBody, userFacingApiError } from "@/lib/userFacingApiError";

type Participant = {
  puuid?: string;
  championName?: string;
  championImageKey?: string;
  teamId?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  win?: boolean;
  summonerName?: string;
  riotIdGameName?: string;
  riotIdTagLine?: string;
};

export default function MatchDetailClient({
  platform,
  matchId,
  gameName,
  tagLine,
}: {
  platform: RiotPlatformId;
  matchId: string;
  gameName: string;
  tagLine: string;
}) {
  const searchParams = useSearchParams();
  const puuidHighlight = searchParams.get("puuid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [info, setInfo] = useState<{
    queueId: number;
    gameDuration: number;
    gameEndTimestamp?: number;
    participants: Participant[];
  } | null>(null);
  const ddVersion = useDdragonVersion();

  const backHref = `/summoner/${platform}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/riot/match?matchId=${encodeURIComponent(matchId)}&platform=${encodeURIComponent(platform)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const b = await parseErrorBody(res);
        const { message, retryable } = userFacingApiError(res.status, b.error);
        setError({ message, retryable });
        return;
      }
      const raw = await res.json();
      const inf = raw?.info;
      if (!inf) {
        setError({ message: "La respuesta de Riot no contenía datos de partida.", retryable: true });
        return;
      }
      setInfo({
        queueId: inf.queueId,
        gameDuration: inf.gameDuration,
        gameEndTimestamp: inf.gameEndTimestamp,
        participants: Array.isArray(inf.participants) ? inf.participants : [],
      });
    } catch {
      setError({
        message: "No se pudo conectar. Comprueba tu red e inténtalo de nuevo.",
        retryable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [platform, matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <MatchLoadingSkeleton />;
  }

  if (error) {
    return (
      <ApiErrorPanel
        message={error.message}
        retryable={error.retryable}
        onRetry={error.retryable ? load : undefined}
        backHref={backHref}
        backLabel={`Volver · ${gameName}#${tagLine}`}
      />
    );
  }

  if (!info) {
    return (
      <ApiErrorPanel
        message="No hay datos de partida."
        retryable
        onRetry={load}
        backHref={backHref}
        backLabel={`Volver · ${gameName}#${tagLine}`}
      />
    );
  }

  const teams: Record<number, Participant[]> = {};
  for (const p of info.participants) {
    const t = p.teamId ?? 0;
    if (!teams[t]) teams[t] = [];
    teams[t].push(p);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        href={backHref}
        className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline sm:mb-6"
      >
        ← {gameName}#{tagLine}
      </Link>
      <div className="mb-6 rounded-xl border border-border bg-card p-4 text-muted-foreground">
        <p className="break-all text-base font-semibold text-foreground sm:text-lg">Partida {matchId}</p>
        <p className="mt-1 text-sm">
          Cola {info.queueId} · {Math.floor(info.gameDuration / 60)} min
          {info.gameEndTimestamp != null ? ` · ${formatEsDateTime(info.gameEndTimestamp)}` : ""}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.keys(teams)
          .sort()
          .map((tid) => (
            <div key={tid}>
              <h2 className="mb-2 text-sm font-semibold text-foreground sm:text-base">Equipo {tid}</h2>
              <ul className="space-y-2">
                {teams[Number(tid)].map((p, i) => {
                  const highlight = puuidHighlight && p.puuid === puuidHighlight;
                  const label =
                    p.summonerName ||
                    (p.riotIdGameName && p.riotIdTagLine
                      ? `${p.riotIdGameName}#${p.riotIdTagLine}`
                      : p.championName || "Invocador");
                  return (
                    <li
                      key={`${p.puuid}-${i}`}
                      className={`flex min-h-[2.75rem] items-center gap-2 rounded-lg border px-2 py-2 text-sm ${
                        highlight
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-muted/40"
                      }`}
                    >
                      {p.championName ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${encodeURIComponent(p.championImageKey ?? p.championName)}.png`}
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 shrink-0 rounded"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-foreground">{label}</div>
                        <div className="text-xs text-muted-foreground/75">
                          {p.kills}/{p.deaths}/{p.assists}{" "}
                          {p.win ? <span className="font-semibold text-emerald-400">W</span> : <span className="font-semibold text-red-400">L</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
