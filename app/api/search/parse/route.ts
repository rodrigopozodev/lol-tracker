import { NextResponse } from "next/server";
import { parseOpggInput } from "@/lib/parseOpggInput";
import { resolvePlayersSimple, CLUSTERS } from "@/lib/riot/multiSearchCore";
import { getRiotApiKey } from "@/lib/riotApiKey";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  let body: { raw?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const raw = typeof body?.raw === "string" ? body.raw : "";
  const parsed = parseOpggInput(raw);
  if (!parsed.players.length) {
    return NextResponse.json({ error: "No se detectaron jugadores GameName#TAG" }, { status: 400 });
  }
  const envDefault = process.env.DEFAULT_RIOT_REGION;
  const globalHint =
    parsed.region ||
    (envDefault && CLUSTERS.includes(envDefault) ? envDefault : null) ||
    "euw1";
  const results = await resolvePlayersSimple(parsed.players, globalHint);
  return NextResponse.json({ results, region: globalHint });
}
