import { getRiotApiKey } from "@/lib/riotApiKey";
import {
  resolvePlayersSimple,
  tagToCluster,
  type MultiSearchPlayerResult,
} from "@/lib/riot/multiSearchCore";
import { isRemakeParticipant } from "@/lib/riot/isRemakeMatch";
import { platformToRegionalCluster, regionalClusterHost } from "@/lib/riot/regionalRouting";

export type ProfileQueueFilter = "solo" | "flex";

const QUEUE_IDS: Record<ProfileQueueFilter, number> = {
  solo: 420,
  flex: 440,
};

export type ProfileMatchRow = {
  matchId: string;
  /** Partida rehecha: no cuenta en V/D ni en totales de la muestra. */
  remake: boolean;
  win: boolean;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  queueId: number;
  gameCreation: number;
  gameDurationSec: number;
};

export type YearStats = {
  year: number;
  wins: number;
  losses: number;
  games: number;
};

/** Victorias/derrotas de la temporada actual en esa cola (misma fuente que OP.GG / cliente de juego). */
export type SeasonWl = { wins: number; losses: number } | null;

export type ProfileOverviewData = {
  player: MultiSearchPlayerResult;
  queueFilter: ProfileQueueFilter;
  /** Récord de temporada (league-v4), no el historial de partidas. */
  seasonRecord: { solo: SeasonWl; flex: SeasonWl };
  matches: ProfileMatchRow[];
  totals: {
    games: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
  };
  byYear: YearStats[];
};

const DEFAULT_MATCH_COUNT = 25;

function riotHeaders() {
  const k = getRiotApiKey();
  if (!k) return null;
  return { "X-Riot-Token": k } as const;
}

async function fetchLeagueEntries(
  platform: string,
  puuid: string
): Promise<Array<{ queueType: string; wins: number; losses: number }> | null> {
  const h = riotHeaders();
  if (!h) return null;
  const url = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
  const res = await fetch(url, { headers: h, cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  if (!Array.isArray(json)) return null;
  return json as Array<{ queueType: string; wins: number; losses: number }>;
}

function seasonWl(
  entries: Array<{ queueType: string; wins: number; losses: number }> | null,
  queue: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR"
): SeasonWl {
  if (!entries?.length) return null;
  const e = entries.find((x) => x.queueType === queue);
  if (!e || typeof e.wins !== "number" || typeof e.losses !== "number") return null;
  return { wins: e.wins, losses: e.losses };
}

async function fetchMatchIdsByQueue(
  regionalHost: string,
  puuid: string,
  queueId: number,
  count: number
): Promise<string[] | null> {
  const h = riotHeaders();
  if (!h) return null;
  const url = `https://${regionalHost}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=${queueId}&start=0&count=${count}`;
  const res = await fetch(url, { headers: h, cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

async function fetchMatchDetail(regionalHost: string, matchId: string): Promise<unknown | null> {
  const h = riotHeaders();
  if (!h) return null;
  const url = `https://${regionalHost}/lol/match/v5/matches/${matchId}`;
  const res = await fetch(url, { headers: h, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function participantFromMatch(match: unknown, puuid: string): ProfileMatchRow | null {
  const m = match as {
    metadata?: { matchId?: string };
    info?: {
      queueId?: number;
      gameCreation?: number;
      gameDuration?: number;
      participants?: Array<{
        puuid?: string;
        win?: boolean;
        gameEndedInEarlySurrender?: boolean;
        championName?: string;
        kills?: number;
        deaths?: number;
        assists?: number;
      }>;
    };
  };
  const id = m.metadata?.matchId;
  const info = m.info;
  if (!id || !info?.participants) return null;
  const me = info.participants.find((p) => p.puuid === puuid);
  if (!me) return null;
  const remake = isRemakeParticipant(me);
  return {
    matchId: id,
    remake,
    win: Boolean(me.win),
    championName: String(me.championName ?? "?"),
    kills: Number(me.kills ?? 0),
    deaths: Number(me.deaths ?? 0),
    assists: Number(me.assists ?? 0),
    queueId: Number(info.queueId ?? 0),
    gameCreation: Number(info.gameCreation ?? 0),
    gameDurationSec: Number(info.gameDuration ?? 0),
  };
}

export async function fetchProfileOverview(
  gameName: string,
  tagLine: string,
  opts?: { queue?: ProfileQueueFilter; matchCount?: number }
): Promise<{ error: string } | ProfileOverviewData> {
  const queueFilter = opts?.queue ?? "solo";
  const matchCount = Math.min(100, Math.max(5, opts?.matchCount ?? DEFAULT_MATCH_COUNT));

  const hint = tagToCluster(tagLine) || "euw1";
  const players = await resolvePlayersSimple([{ gameName, tagLine }], hint);
  const player = players[0];
  if (!player || player.error) {
    return { error: player?.error || "Invocador no encontrado" };
  }
  if (!player.puuid) {
    return { error: "Sin PUUID" };
  }

  const platform = player.platformId || hint;
  const regional = platformToRegionalCluster(platform);
  const host = regionalClusterHost(regional);

  const leagueEntries = await fetchLeagueEntries(platform, player.puuid);
  const seasonRecord = {
    solo: seasonWl(leagueEntries, "RANKED_SOLO_5x5"),
    flex: seasonWl(leagueEntries, "RANKED_FLEX_SR"),
  };

  const queueId = QUEUE_IDS[queueFilter];
  const ids = await fetchMatchIdsByQueue(host, player.puuid, queueId, matchCount);
  if (!ids) {
    return { error: "No se pudo obtener el historial (¿API key o rate limit?)" };
  }

  const matches: ProfileMatchRow[] = [];
  for (const mid of ids) {
    const detail = await fetchMatchDetail(host, mid);
    if (!detail) continue;
    const row = participantFromMatch(detail, player.puuid);
    if (row) matches.push(row);
  }

  const totals = {
    games: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
  const yearMap = new Map<number, { wins: number; losses: number; games: number }>();

  for (const m of matches) {
    if (m.remake) continue;
    totals.games++;
    if (m.win) totals.wins++;
    else totals.losses++;
    totals.kills += m.kills;
    totals.deaths += m.deaths;
    totals.assists += m.assists;

    if (m.gameCreation > 0) {
      const y = new Date(m.gameCreation).getFullYear();
      if (!yearMap.has(y)) yearMap.set(y, { wins: 0, losses: 0, games: 0 });
      const yv = yearMap.get(y)!;
      yv.games++;
      if (m.win) yv.wins++;
      else yv.losses++;
    }
  }

  const byYear: YearStats[] = [...yearMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, v]) => ({ year, ...v }));

  return {
    player,
    queueFilter,
    seasonRecord,
    matches,
    totals,
    byYear,
  };
}
