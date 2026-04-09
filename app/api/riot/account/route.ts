import { NextResponse } from "next/server";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { resolveAccountByRiotId } from "@/lib/riot/accountLookupServer";

export async function GET(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");
  const platformParam = searchParams.get("platform")?.trim() || null;

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: "Faltan gameName y tagLine" }, { status: 400 });
  }

  const result = await resolveAccountByRiotId(gameName, tagLine, platformParam);

  if (!result.ok) {
    const status = result.status === 502 ? 502 : 404;
    return NextResponse.json({ error: result.error ?? "Cuenta no encontrada" }, { status });
  }

  return NextResponse.json(result.body);
}
