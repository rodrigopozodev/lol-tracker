import { NextResponse } from "next/server";

interface LeagueEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

async function fetchLeagueEntriesByPuuid(puuid: string): Promise<{ entries: LeagueEntry[]; region: string } | null> {
  if (!RIOT_API_KEY) return null;
  for (const cluster of CLUSTERS) {
    const url = `https://${cluster}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
      if (res.ok) {
        const entriesJson: unknown = await res.json();
        if (Array.isArray(entriesJson)) {
          return { entries: entriesJson as LeagueEntry[], region: cluster };
        }
      }
    } catch (error) {
      // continuar
    }
  }
  return null;
}

export async function GET(req: Request) {
  if (!RIOT_API_KEY) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const puuid = searchParams.get("puuid");
  if (!puuid) {
    return NextResponse.json({ error: "Falta puuid" }, { status: 400 });
  }

  const result = await fetchLeagueEntriesByPuuid(puuid);
  if (!result) {
    return NextResponse.json({ error: "No se pudo obtener información de ranking" }, { status: 404 });
  }

  const { entries, region } = result;
  try {
    const normalized = entries
      .filter((entry: LeagueEntry) => Boolean(entry && entry.queueType))
      .map((entry: LeagueEntry) => ({
        queue: entry.queueType,
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
      }));
    const solo = normalized.find((x) => x.queue === "RANKED_SOLO_5x5") || null;
    const flex = normalized.find((x) => x.queue === "RANKED_FLEX_SR") || null;
    return NextResponse.json({ solo, flex, entries: normalized, region });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}