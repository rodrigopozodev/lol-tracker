import { NextResponse } from "next/server";

const RIOT_API_KEY = process.env.RIOT_API_KEY as string | undefined;

const CLUSTERS = [
  "euw1","eun1","na1","kr","br1","la1","la2","jp1","oc1","ru","tr1"
];

const ACCOUNT_GROUPS = ["europe", "americas", "asia"];

async function fetchAccountByRiotId(gameName: string, tagLine: string) {
  const headers = { "X-Riot-Token": process.env.RIOT_API_KEY || "" };
  let lastStatus = 404;
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
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

async function fetchAccountByPuuid(puuid: string) {
  const headers = { "X-Riot-Token": process.env.RIOT_API_KEY || "" };
  for (const group of ACCOUNT_GROUPS) {
    const url = `https://${group}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        return await res.json();
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

async function findPuuidBySummonerName(name: string): Promise<string | null> {
  if (!RIOT_API_KEY) return null;
  for (const cluster of CLUSTERS) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`;
    try {
      const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        const puuid = json?.puuid as string | undefined;
        if (puuid) return puuid;
      }
    } catch (e) {
      // continuar con siguiente cluster
    }
  }
  return null;
}

async function fetchSummonerByPuuid(puuid: string) {
  if (!RIOT_API_KEY) return null;
  for (const cluster of CLUSTERS) {
    const url = `https://${cluster}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
    try {
      const res = await fetch(url, { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        return { ...json, region: cluster };
      }
    } catch (e) {
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
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");
  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "Faltan gameName y tagLine" }, { status: 400 });
  }

  const accountRes = await fetchAccountByRiotId(gameName, tagLine);
  let puuid: string | null = null;
  let acctJson: any = null;

  if (accountRes.ok && accountRes.json?.puuid) {
    puuid = accountRes.json.puuid;
    acctJson = accountRes.json;
  } else if (accountRes.status === 404) {
    // fallback por nombre
    puuid = await findPuuidBySummonerName(gameName);
    if (puuid) {
      acctJson = await fetchAccountByPuuid(puuid);
    }
  } else if (accountRes.status === 403) {
    return NextResponse.json({ error: "Riot API: token inválido o caducado", status: 403 }, { status: 502 });
  }

  if (!puuid) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const summoner = await fetchSummonerByPuuid(puuid);

  return NextResponse.json({
    gameName: acctJson?.gameName ?? gameName,
    tagLine: acctJson?.tagLine ?? tagLine,
    name: summoner?.name ?? null,
    summonerLevel: summoner?.summonerLevel ?? null,
    profileIconId: summoner?.profileIconId ?? null,
    region: summoner?.region ?? null,
  });
}