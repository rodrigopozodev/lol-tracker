import { NextResponse } from "next/server";
import {
  CLUSTERS,
  resolvePlayersSimple,
  parseTextToPlayers,
  resolveMultiSearchPayload,
} from "@/lib/riot/multiSearchCore";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { parseSingleRiotId } from "@/lib/parseRiotId";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const namesParam = searchParams.get("names");
  const regionParam = searchParams.get("region");

  if (!namesParam) {
    return NextResponse.json({ error: "Falta parámetro 'names'" }, { status: 400 });
  }

  const players = namesParam
    .split(",")
    .map((name) => parseSingleRiotId(name))
    .filter(Boolean) as { gameName: string; tagLine: string }[];

  if (!players.length) {
    return NextResponse.json(
      { error: "Formato de 'names' inválido. Use: Jugador#TAG o Jugador # TAG (se permiten espacios alrededor de #)" },
      { status: 400 }
    );
  }

  const globalHint = regionParam && CLUSTERS.includes(regionParam) ? regionParam : null;
  const results = await resolvePlayersSimple(players, globalHint);
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  let payload: {
    players?: { gameName: string; tagLine: string }[];
    text?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const out = await resolveMultiSearchPayload(payload);
  if (out.error) {
    return NextResponse.json({ error: out.error }, { status: 400 });
  }
  return NextResponse.json({ results: out.results });
}
