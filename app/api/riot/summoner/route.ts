import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

const ACCOUNT_GROUPS = ["europe","americas","asia"];

async function fetchAccountByPuuid(puuid: string) {
  if (!RIOT_API_KEY) return null;
  for (const group of ACCOUNT_GROUPS) {
    try {
      const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
      const res = await fetch(url, {
        headers: { "X-Riot-Token": RIOT_API_KEY },
        cache: "no-store",
      });
      if (res.ok) {
        return res.json();
      }
      if (res.status === 403) {
        return "RIOT_TOKEN_INVALID" as any;
      }
    } catch (e) {
      // try next group
    }
  }
  return null;
}

async function fetchSummonerByPuuid(puuid: string) {
  if (!RIOT_API_KEY) return null;
  for (const cluster of CLUSTERS) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, {
        headers: { "X-Riot-Token": RIOT_API_KEY },
        cache: "no-store",
      });
      if (res.status === 403) {
        return "RIOT_TOKEN_INVALID" as any;
      }
      if (res.ok) {
        const json = await res.json();
        return { ...json, region: cluster };
      }
    } catch (e) {
      console.warn("[riot] summoner by puuid error", { cluster, error: (e as any)?.message || e });
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

  const [account, summoner] = await Promise.all([
    fetchAccountByPuuid(puuid),
    fetchSummonerByPuuid(puuid),
  ]);

  if (account === "RIOT_TOKEN_INVALID" || summoner === "RIOT_TOKEN_INVALID") {
    return NextResponse.json({ error: "Riot API: token inválido o caducado" }, { status: 502 });
  }

  if (!summoner) {
    return NextResponse.json({ error: "No se pudo resolver el invocador por PUUID" }, { status: 404 });
  }

  return NextResponse.json({
    gameName: (account as any)?.gameName ?? null,
    tagLine: (account as any)?.tagLine ?? null,
    name: (summoner as any)?.name ?? null,
    summonerId: (summoner as any)?.id ?? null,
    summonerLevel: (summoner as any)?.summonerLevel ?? null,
    profileIconId: (summoner as any)?.profileIconId ?? null,
    region: (summoner as any)?.region ?? null,
  });
}