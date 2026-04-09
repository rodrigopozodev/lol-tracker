import { getRiotApiKey } from "@/lib/riotApiKey";
import { riotFetch } from "@/lib/riot/riotFetch";
import {
  defaultRiotTaglineForPlatform,
  isRiotPlatform,
  type RiotPlatformId,
} from "@/lib/riot/platforms";

export const RIOT_CLUSTERS = [
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
] as const;

const ACCOUNT_GROUPS = ["europe", "americas", "asia"];

export type RiotAccountJson = {
  puuid?: string;
  gameName?: string;
  tagLine?: string;
};

export type ResolvedAccountBody = {
  puuid: string;
  gameName: string;
  tagLine: string;
  name: string | null;
  summonerLevel: number | null;
  profileIconId: number | null;
  region: string | null;
};

export async function fetchAccountByRiotId(
  gameName: string,
  tagLine: string
): Promise<
  { ok: true; status: number; json: RiotAccountJson } | { ok: false; status: number; json: null }
> {
  const key = getRiotApiKey() || "";
  let lastStatus = 404;
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    try {
      const res = await riotFetch(url, key);
      if (res.ok) {
        const json = (await res.json()) as RiotAccountJson;
        return { ok: true, status: res.status, json };
      }
      if (res.status === 403) {
        return { ok: false, status: 403, json: null };
      }
      lastStatus = res.status;
    } catch {
      // continue trying other groups
    }
  }
  return { ok: false, status: lastStatus, json: null };
}

export async function fetchAccountByPuuid(puuid: string): Promise<RiotAccountJson | null> {
  const key = getRiotApiKey() || "";
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await riotFetch(url, key);
      if (res.ok) {
        return (await res.json()) as RiotAccountJson;
      }
      if (res.status === 403) {
        throw new Error("RIOT_TOKEN_INVALID");
      }
    } catch {
      // try next group
    }
  }
  return null;
}

export async function findPuuidBySummonerName(
  name: string,
  preferredCluster?: string | null
): Promise<string | null> {
  const key = getRiotApiKey();
  if (!key) return null;
  const pref = preferredCluster?.toLowerCase().trim() || "";
  const clusters = RIOT_CLUSTERS as readonly string[];
  const order =
    pref && clusters.includes(pref) ? [pref, ...clusters.filter((c) => c !== pref)] : [...clusters];
  for (const cluster of order) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`;
    try {
      const res = await riotFetch(url, key);
      if (res.ok) {
        const json = await res.json();
        const puuid = json?.puuid as string | undefined;
        if (puuid) return puuid;
      }
    } catch {
      // continuar con siguiente cluster
    }
  }
  return null;
}

/** Solo el cluster elegido (región del usuario); evita devolver un homónimo de otra región. */
export async function findPuuidBySummonerNameInCluster(
  name: string,
  cluster: RiotPlatformId
): Promise<string | null> {
  const key = getRiotApiKey();
  if (!key) return null;
  const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`;
  try {
    const res = await riotFetch(url, key);
    if (res.ok) {
      const json = await res.json();
      const puuid = json?.puuid as string | undefined;
      if (puuid) return puuid;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchSummonerByPuuid(puuid: string, preferredCluster?: string | null) {
  const key = getRiotApiKey();
  if (!key) return null;
  const pref = preferredCluster?.toLowerCase().trim() || "";
  const clusters = RIOT_CLUSTERS as readonly string[];
  const order =
    pref && clusters.includes(pref) ? [pref, ...clusters.filter((c) => c !== pref)] : [...clusters];
  for (const cluster of order) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await riotFetch(url, key);
      if (res.ok) {
        const json = await res.json();
        return { ...json, region: cluster };
      }
    } catch {
      // continuar
    }
  }
  return null;
}

function normalizePlatformHint(platformParam: string | null): RiotPlatformId | null {
  const p = platformParam?.trim().toLowerCase() || "";
  return p && isRiotPlatform(p) ? p : null;
}

export async function resolveAccountByRiotId(
  gameName: string,
  tagLine: string,
  platformParam: string | null
): Promise<{ ok: true; body: ResolvedAccountBody } | { ok: false; status: number; error?: string }> {
  const platformHint = normalizePlatformHint(platformParam);

  const accountRes = await fetchAccountByRiotId(gameName, tagLine);
  let puuid: string | null = null;
  let acctJson: RiotAccountJson | null = null;

  if (accountRes.ok && accountRes.json?.puuid) {
    puuid = accountRes.json.puuid;
    acctJson = accountRes.json;
  } else if (accountRes.status === 404) {
    puuid = await findPuuidBySummonerName(gameName, platformHint);
    if (puuid) {
      acctJson = await fetchAccountByPuuid(puuid);
    }
  } else if (accountRes.status === 403) {
    return { ok: false, status: 502, error: "Riot API: token inválido o caducado" };
  }

  if (!puuid) {
    return { ok: false, status: 404, error: "Cuenta no encontrada" };
  }

  const summoner = await fetchSummonerByPuuid(puuid, platformHint);

  return {
    ok: true,
    body: {
      puuid,
      gameName: acctJson?.gameName ?? gameName,
      tagLine: acctJson?.tagLine ?? tagLine,
      name: summoner?.name ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
      profileIconId: summoner?.profileIconId ?? null,
      region: summoner?.region ?? null,
    },
  };
}

/**
 * Sin "#TAG": la API Riot no busca por prefijo. Intentamos el R típico de la región (ej. EUW)
 * y, si falla, summoner/v4/by-name solo en la plataforma seleccionada.
 */
export async function resolveAccountByNameAndPlatform(
  gameNameOnly: string,
  platform: RiotPlatformId
): Promise<{ ok: true; body: ResolvedAccountBody } | { ok: false; status: number; error?: string }> {
  const tagGuess = defaultRiotTaglineForPlatform(platform);
  const byRiotId = await fetchAccountByRiotId(gameNameOnly, tagGuess);

  let puuid: string | null = null;
  let acctJson: RiotAccountJson | null = null;

  if (byRiotId.status === 403) {
    return { ok: false, status: 502, error: "Riot API: token inválido o caducado" };
  }

  if (byRiotId.ok && byRiotId.json?.puuid) {
    puuid = byRiotId.json.puuid;
    acctJson = byRiotId.json;
  } else {
    puuid = await findPuuidBySummonerNameInCluster(gameNameOnly, platform);
    if (puuid) {
      acctJson = await fetchAccountByPuuid(puuid);
    }
  }

  if (!puuid) {
    return { ok: false, status: 404, error: "Cuenta no encontrada" };
  }

  const summoner = await fetchSummonerByPuuid(puuid, platform);

  return {
    ok: true,
    body: {
      puuid,
      gameName: acctJson?.gameName ?? gameNameOnly,
      tagLine: acctJson?.tagLine ?? tagGuess,
      name: summoner?.name ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
      profileIconId: summoner?.profileIconId ?? null,
      region: summoner?.region ?? null,
    },
  };
}

/** TAG extra a probar (pocas llamadas; evita typeaheads de minutos con 429). */
const RIOT_TYPEAHEAD_TAG_GUESSES = ["ESP", "EUNE", "NA", "LAN", "LAS"] as const;

const MAX_TYPEAHEAD_RESULTS = 10;
const MAX_EXTRA_SHARDS = 2;
const MAX_TAG_TRIES = 5;


function sortTypeaheadBodies(
  list: ResolvedAccountBody[],
  q: string,
  platform: RiotPlatformId
): ResolvedAccountBody[] {
  const ql = q.toLowerCase();
  return [...list].sort((a, b) => {
    const aPref = a.gameName.toLowerCase().startsWith(ql) ? 0 : 1;
    const bPref = b.gameName.toLowerCase().startsWith(ql) ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    const ap = a.region === platform ? 0 : 1;
    const bp = b.region === platform ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return `${a.gameName}#${a.tagLine}`.localeCompare(`${b.gameName}#${b.tagLine}`, "es");
  });
}

/**
 * Búsqueda Riot acotada: primero summoner by-name en tu región (rápido), luego pocos shards
 * y pocos #TAG para no disparar 429 ni dejar el typeahead colgado minutos.
 */
export async function riotDirectorySearch(
  query: string,
  platform: RiotPlatformId
): Promise<ResolvedAccountBody[]> {
  const key = getRiotApiKey();
  if (!key) return [];
  const q = query.trim();
  if (q.length < 2 || q.includes("#")) return [];

  const byPuuid = new Map<string, ResolvedAccountBody>();

  async function ingest(puuid: string, prefCluster: RiotPlatformId) {
    if (byPuuid.has(puuid) || byPuuid.size >= MAX_TYPEAHEAD_RESULTS) return;
    const acct = await fetchAccountByPuuid(puuid);
    if (!acct?.puuid || typeof acct.gameName !== "string" || typeof acct.tagLine !== "string") return;
    const summoner = await fetchSummonerByPuuid(puuid, prefCluster);
    byPuuid.set(puuid, {
      puuid,
      gameName: acct.gameName,
      tagLine: acct.tagLine,
      name: summoner?.name ?? null,
      summonerLevel: summoner?.summonerLevel ?? null,
      profileIconId: summoner?.profileIconId ?? null,
      region: summoner?.region ?? null,
    });
  }

  const pLocal = await findPuuidBySummonerNameInCluster(q, platform);
  if (pLocal) {
    await ingest(pLocal, platform);
  }

  const looksLikeFullName = q.includes(" ") && q.length >= 4;
  if (looksLikeFullName && byPuuid.size > 0) {
    return sortTypeaheadBodies([...byPuuid.values()], q, platform);
  }

  const clusterOrder = [
    platform,
    ...RIOT_CLUSTERS.filter((c) => c !== platform),
  ] as RiotPlatformId[];

  let extra = 0;
  for (const cluster of clusterOrder.slice(1)) {
    if (extra >= MAX_EXTRA_SHARDS || byPuuid.size >= MAX_TYPEAHEAD_RESULTS) break;
    extra += 1;
    const p = await findPuuidBySummonerNameInCluster(q, cluster);
    if (p) await ingest(p, cluster);
  }

  const defaultTag = defaultRiotTaglineForPlatform(platform);
  const tags = [...new Set([defaultTag, ...RIOT_TYPEAHEAD_TAG_GUESSES])].slice(0, MAX_TAG_TRIES);

  for (const tag of tags) {
    if (byPuuid.size >= MAX_TYPEAHEAD_RESULTS) break;
    const acc = await fetchAccountByRiotId(q, tag);
    if (acc.status === 403) break;
    if (acc.ok && acc.json?.puuid) await ingest(acc.json.puuid, platform);
  }

  return sortTypeaheadBodies([...byPuuid.values()], q, platform);
}
