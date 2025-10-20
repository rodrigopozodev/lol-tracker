import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

const ACCOUNT_GROUPS = ["europe", "americas", "asia"];

function normalizeRank(entry: any | null): string | null {
  if (!entry) return null;
  const tier = entry.tier || "";
  const rank = entry.rank || "";
  const lp = typeof entry.leaguePoints === "number" ? `${entry.leaguePoints} LP` : "";
  const base = `${tier} ${rank}`.trim();
  return lp ? `${base} ${lp}` : base || null;
}

function tagToCluster(tag?: string | null): string | null {
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
    ESP: "euw1", // usuarios con #ESP suelen jugar en EUW
  };
  return map[t] || null;
}

function parsePlayers(text: string): { gameName: string; tagLine: string }[] {
  const tokens = text
    .split(/\s|,|;|\n|\r/)
    .map((t) => t.trim())
    .filter(Boolean);
  const res: { gameName: string; tagLine: string }[] = [];
  for (const tok of tokens) {
    const m = tok.match(/^(.+?)[#-]([A-Za-z0-9]+)$/);
    if (m) {
      res.push({ gameName: m[1], tagLine: m[2] });
    }
  }
  return res;
}

async function fetchAccountByRiotId(gameName: string, tagLine: string) {
  const headers = { "X-Riot-Token": (RIOT_API_KEY || "") };
  let lastStatus = 404;
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        return await res.json();
      }
      lastStatus = res.status;
      if (res.status === 403) throw new Error("RIOT_TOKEN_INVALID");
    } catch {}
  }
  return null;
}

async function findPuuidBySummonerName(name: string, preferredCluster?: string): Promise<string | null> {
  if (!RIOT_API_KEY) return null;
  const headers = { "X-Riot-Token": (RIOT_API_KEY || "") };
  const clusters = preferredCluster ? [preferredCluster, ...CLUSTERS.filter((c) => c !== preferredCluster)] : CLUSTERS;
  for (const cluster of clusters) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json?.puuid) return json.puuid as string;
      }
    } catch {}
  }
  return null;
}

async function fetchSummonerByPuuid(puuid: string, preferredCluster?: string) {
  if (!RIOT_API_KEY) return null;
  const headers = { "X-Riot-Token": (RIOT_API_KEY || "") };
  const clusters = preferredCluster ? [preferredCluster, ...CLUSTERS.filter((c) => c !== preferredCluster)] : CLUSTERS;
  for (const cluster of clusters) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return { ...json, region: cluster };
      }
    } catch {}
  }
  return null;
}

async function fetchLeagueBySummonerId(region: string, summonerId: string) {
  if (!RIOT_API_KEY) return null;
  const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`;
  try {
    const res = await fetch(url, { headers: { "X-Riot-Token": (RIOT_API_KEY || "") }, cache: "no-store" });
    if (!res.ok) return null;
    const entries: any[] = await res.json();
    const normalized = entries
      .filter((e) => e && e.queueType)
      .map((e) => ({
        queue: e.queueType,
        tier: e.tier,
        rank: e.rank,
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
      }));
    const solo = normalized.find((x) => x.queue === "RANKED_SOLO_5x5") || null;
    const flex = normalized.find((x) => x.queue === "RANKED_FLEX_SR") || null;
    return { solo, flex, entries: normalized };
  } catch {
    return null;
  }
}

function parseSummonersParam(value: string): { gameName: string; tagLine: string }[] {
  const items = value.split(",").map((s) => s.trim()).filter(Boolean);
  const players: { gameName: string; tagLine: string }[] = [];
  for (const item of items) {
    const decoded = decodeURIComponent(item.replace(/\+/g, " "));
    const m = decoded.match(/^(.+?)#([A-Za-z0-9]+)$/);
    if (m) players.push({ gameName: m[1].trim(), tagLine: m[2].trim() });
  }
  return players;
}

function parseTextToPlayers(text: string): { gameName: string; tagLine: string }[] {
  const chunks = text.split(/[;,\n\r]+/).map((s) => s.trim()).filter(Boolean);
  const players: { gameName: string; tagLine: string }[] = [];
  if (chunks.length > 1) {
    for (const c of chunks) {
      const m = c.match(/^(.+?)#([A-Za-z0-9]+)$/);
      if (m) players.push({ gameName: m[1].trim(), tagLine: m[2].trim() });
    }
    if (players.length) return players;
  }
  const matches = [...text.matchAll(/([^#]+)#([A-Za-z0-9]+)/g)];
  for (const mt of matches) {
    players.push({ gameName: mt[1].trim().replace(/\s+/g, " "), tagLine: mt[2].trim() });
  }
  return players;
}

async function resolvePlayers(players: { gameName: string; tagLine: string }[], globalRegionHint?: string | null) {
  const results = await Promise.all(
    players.map(async ({ gameName, tagLine }) => {
      try {
        const perPlayerHint = tagToCluster(tagLine) || globalRegionHint || null;

        // 1) PUUID desde Riot ID
        let puuid: string | null = null;
        const acct = await fetchAccountByRiotId(gameName, tagLine);
        if (acct?.puuid) puuid = acct.puuid;

        // 2) Fallback: buscar por nombre en el clúster indicado
        if (!puuid) puuid = await findPuuidBySummonerName(gameName, perPlayerHint || undefined);
        if (!puuid) {
          return { name: gameName, tag: tagLine, error: "No encontrado" };
        }

        // 3) Summoner básico por PUUID (prioriza el clúster)
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
      } catch (e: any) {
        return { name: gameName, tag: tagLine, error: e?.message || "Error" };
      }
    })
  );
  return results;
}

export async function GET(req: Request) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const summonersParam = searchParams.get("summoners");
  const regionParam = searchParams.get("region");
  if (!summonersParam) {
    return NextResponse.json({ error: "Falta parámetro 'summoners'" }, { status: 400 });
  }
  const players = parseSummonersParam(summonersParam);
  if (!players.length) {
    return NextResponse.json({ error: "Formato de 'summoners' inválido" }, { status: 400 });
  }
  const globalHint = regionParam && CLUSTERS.includes(regionParam) ? regionParam : null;
  const results = await resolvePlayers(players, globalHint);
  return NextResponse.json({ results });
}

export async function POST(req: Request) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  let players: { gameName: string; tagLine: string }[] = Array.isArray(payload?.players) ? payload.players : [];
  if ((!players || players.length === 0) && typeof payload?.text === "string") {
    players = parseTextToPlayers(payload.text);
  }
  if (!players || players.length === 0) {
    return NextResponse.json({ error: "Faltan jugadores (players o text)" }, { status: 400 });
  }

  const results = await resolvePlayers(players);
  return NextResponse.json({ results });
}