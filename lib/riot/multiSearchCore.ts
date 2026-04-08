/** Shared Riot multi-search resolution (used by API route, cron, server pages). */

import { getRiotApiKey } from "@/lib/riotApiKey";
import { parseSingleRiotId } from "@/lib/parseRiotId";

export const CLUSTERS = [
  "euw1",
  "eun1",
  "na1",
  "kr",
  "br1",
  "la1",
  "la2",
  "jp1",
  "oc1",
  "ru",
  "tr1",
];

const ACCOUNT_GROUPS = ["europe", "americas", "asia"];

function normalizeRank(entry: Record<string, unknown> | null): string | null {
  if (!entry) return null;
  const tier = (entry.tier as string) || "";
  const rank = (entry.rank as string) || "";
  const lp =
    typeof entry.leaguePoints === "number" ? `${entry.leaguePoints} LP` : "";
  const base = `${tier} ${rank}`.trim();
  return lp ? `${base} ${lp}` : base || null;
}

export function tagToCluster(tag?: string | null): string | null {
  if (!tag) return null;
  const t = tag.toUpperCase();
  const map: Record<string, string> = {
    EUW: "euw1",
    EUNE: "eun1",
    NA: "na1",
    KR: "kr",
    BR: "br1",
    LAS: "la1",
    LAN: "la2",
    JP: "jp1",
    OCE: "oc1",
    RU: "ru",
    TR: "tr1",
    ESP: "euw1",
  };
  return map[t] || null;
}

async function fetchAccountByRiotId(gameName: string, tagLine: string) {
  const RIOT_API_KEY = getRiotApiKey();
  if (!RIOT_API_KEY) return null;
  const headers = { "X-Riot-Token": RIOT_API_KEY || "" };
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) return await res.json();
    if (res.status === 403) throw new Error("RIOT_TOKEN_INVALID");
  }
  return null;
}

async function fetchSummonerByPuuid(puuid: string, preferredCluster?: string) {
  const RIOT_API_KEY = getRiotApiKey();
  if (!RIOT_API_KEY) return null;
  const headers = { "X-Riot-Token": RIOT_API_KEY };
  const clusters = preferredCluster
    ? [preferredCluster, ...CLUSTERS.filter((c) => c !== preferredCluster)]
    : CLUSTERS;
  for (const cluster of clusters) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      return { ...json, region: cluster };
    }
    if (res.status === 403) throw new Error("RIOT_TOKEN_INVALID");
  }
  return null;
}

export type MultiSearchPlayerResult = {
  name: string;
  tag: string;
  region: string;
  /** Plataforma Riot (p. ej. euw1) para match-v5 / league-v4 */
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
};

export async function resolvePlayersSimple(
  players: { gameName: string; tagLine: string }[],
  globalRegionHint?: string | null
): Promise<MultiSearchPlayerResult[]> {
  const RIOT_API_KEY = getRiotApiKey();
  if (!RIOT_API_KEY) {
    return players.map((p) => ({
      name: p.gameName,
      tag: p.tagLine,
      region: "",
      level: null,
      profileIconId: null,
      error: "RIOT_API_KEY no configurada",
    }));
  }

  const results: MultiSearchPlayerResult[] = [];

  const regionMap: Record<string, string> = {
    euw1: "EUW",
    eun1: "EUNE",
    na1: "NA",
    kr: "KR",
    br1: "BR",
    la1: "LAS",
    la2: "LAN",
    jp1: "JP",
    oc1: "OCE",
    ru: "RU",
    tr1: "TR",
  };

  for (const player of players) {
    try {
      const account = await fetchAccountByRiotId(player.gameName, player.tagLine);
      if (!account?.puuid) {
        results.push({
          error: "Invocador no encontrado",
          name: player.gameName,
          tag: player.tagLine,
          region: "",
          level: null,
          profileIconId: null,
        });
        continue;
      }
      const preferredCluster =
        tagToCluster(player.tagLine) || globalRegionHint || "euw1";
      const summoner = await fetchSummonerByPuuid(account.puuid, preferredCluster);
      if (!summoner) {
        results.push({
          error: "Invocador no encontrado",
          name: player.gameName,
          tag: player.tagLine,
          region: "",
          level: null,
          profileIconId: null,
        });
        continue;
      }

      let soloRank: string | null = null;
      let flexRank: string | null = null;
      let soloIconUrl: string | null = null;
      let flexIconUrl: string | null = null;
      let soloWins: number | null = null;
      let soloLosses: number | null = null;
      let flexWins: number | null = null;
      let flexLosses: number | null = null;

      {
        const preferred = summoner.region
          ? [summoner.region, ...CLUSTERS.filter((c) => c !== summoner.region)]
          : CLUSTERS;
        let entries: Record<string, unknown>[] | null = null;
        for (const cluster of preferred) {
          try {
            const url = `https://${cluster}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`;
            const res = await fetch(url, {
              headers: { "X-Riot-Token": RIOT_API_KEY },
              cache: "no-store",
            });
            if (res.ok) {
              entries = await res.json();
              break;
            }
          } catch {
            /* continue */
          }
        }
        if (entries && Array.isArray(entries)) {
          const normalized = entries
            .filter((e) => e && (e as { queueType?: string }).queueType)
            .map((e) => ({
              queue: (e as { queueType: string }).queueType,
              tier: (e as { tier: string }).tier,
              rank: (e as { rank: string }).rank,
              leaguePoints: (e as { leaguePoints: number }).leaguePoints,
              wins: (e as { wins: number }).wins,
              losses: (e as { losses: number }).losses,
            }));
          const solo = normalized.find((x) => x.queue === "RANKED_SOLO_5x5") || null;
          const flex = normalized.find((x) => x.queue === "RANKED_FLEX_SR") || null;

          if (solo) {
            soloRank = normalizeRank(solo);
            if (typeof solo.wins === "number") soloWins = solo.wins;
            if (typeof solo.losses === "number") soloLosses = solo.losses;
            if (solo.tier) {
              soloIconUrl = `https://opgg-static.akamaized.net/images/medals_new/${String(solo.tier).toLowerCase()}.png`;
            }
          }
          if (flex) {
            flexRank = normalizeRank(flex);
            if (typeof flex.wins === "number") flexWins = flex.wins;
            if (typeof flex.losses === "number") flexLosses = flex.losses;
            if (flex.tier) {
              flexIconUrl = `https://opgg-static.akamaized.net/images/medals_new/${String(flex.tier).toLowerCase()}.png`;
            }
          }
        }
      }

      results.push({
        name: account.gameName,
        tag: account.tagLine,
        region: regionMap[summoner.region as string] || String(summoner.region).toUpperCase(),
        platformId:
          typeof summoner.region === "string" ? (summoner.region as string) : null,
        level: summoner.summonerLevel as number,
        profileIconId: summoner.profileIconId as number,
        puuid: account.puuid,
        soloRank: soloRank || "Unranked",
        flexRank: flexRank || "Unranked",
        soloIconUrl,
        flexIconUrl,
        soloWins,
        soloLosses,
        flexWins,
        flexLosses,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "RIOT_TOKEN_INVALID") {
        results.push({
          error: "Riot API: token inválido o caducado",
          name: player.gameName,
          tag: player.tagLine,
          region: "",
          level: null,
          profileIconId: null,
        });
      } else {
      results.push({
        error: "Error de conexión",
        name: player.gameName,
        tag: player.tagLine,
        region: "",
        level: null,
        profileIconId: null,
      });
      }
    }
  }
  return results;
}

export function parseTextToPlayers(text: string): { gameName: string; tagLine: string }[] {
  const chunks = text.split(/[;,\n\r]+/).map((s) => s.trim()).filter(Boolean);
  const players: { gameName: string; tagLine: string }[] = [];
  if (chunks.length > 1) {
    for (const c of chunks) {
      const p = parseSingleRiotId(c);
      if (p) players.push(p);
    }
    if (players.length) return players;
  }
  const single = parseSingleRiotId(text.trim());
  if (single) return [single];

  const matches = [...text.matchAll(/([^#]+?)\s*#\s*([A-Za-z0-9]+)/g)];
  for (const mt of matches) {
    players.push({
      gameName: mt[1].trim().replace(/\s+/g, " "),
      tagLine: mt[2].trim(),
    });
  }
  return players;
}

async function resolvePlayers(
  players: { gameName: string; tagLine: string }[],
  globalRegionHint?: string | null
) {
  const results = await Promise.all(
    players.map(async ({ gameName, tagLine }) => {
      try {
        const perPlayerHint = tagToCluster(tagLine) || globalRegionHint || null;
        let puuid: string | null = null;
        const acct = await fetchAccountByRiotId(gameName, tagLine);
        if (acct?.puuid) puuid = acct.puuid;
        if (!puuid) {
          return { name: gameName, tag: tagLine, error: "No encontrado" };
        }
        const summoner = await fetchSummonerByPuuid(puuid, perPlayerHint || undefined);
        if (!summoner?.id) {
          return { name: gameName, tag: tagLine, error: "No se pudo obtener el summoner" };
        }
        return {
          name: summoner?.name ?? gameName,
          tag: tagLine,
          level: summoner?.summonerLevel ?? null,
          icon: summoner?.profileIconId ?? null,
          region: summoner?.region ?? perPlayerHint ?? null,
          puuid,
        };
      } catch (e: unknown) {
        const err = e as { message?: string };
        return { name: gameName, tag: tagLine, error: err?.message || "Error" };
      }
    })
  );
  return results;
}

export async function resolveMultiSearchPayload(payload: {
  players?: { gameName: string; tagLine: string }[];
  text?: string;
}): Promise<
  | { error: string; results: null }
  | { error: null; results: Awaited<ReturnType<typeof resolvePlayers>> }
> {
  let players: { gameName: string; tagLine: string }[] = Array.isArray(payload?.players)
    ? payload.players
    : [];
  if ((!players || players.length === 0) && typeof payload?.text === "string") {
    players = parseTextToPlayers(payload.text);
  }
  if (!players || players.length === 0) {
    return { error: "Faltan jugadores (players o text)", results: null };
  }
  const results = await resolvePlayers(players);
  return { error: null, results };
}
