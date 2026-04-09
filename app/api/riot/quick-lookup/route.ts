import { NextResponse } from "next/server";
import { getRiotApiKey } from "@/lib/riotApiKey";
import { resolveAccountByNameAndPlatform } from "@/lib/riot/accountLookupServer";
import { isRiotPlatform } from "@/lib/riot/platforms";

/** Nombre sin "#"; resolución en la región elegida (etiqueta típica + summoner by-name). */
export async function GET(req: Request) {
  if (!getRiotApiKey()) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const platformRaw = searchParams.get("platform")?.trim().toLowerCase() ?? "";

  if (!q || q.includes("#")) {
    return NextResponse.json({ error: "Parámetro q inválido (usa solo el nombre, sin #)" }, { status: 400 });
  }

  if (!isRiotPlatform(platformRaw)) {
    return NextResponse.json({ error: "platform inválida" }, { status: 400 });
  }

  if (q.length < 2 || q.length > 32) {
    return NextResponse.json({ error: "Nombre demasiado corto o largo" }, { status: 400 });
  }

  const result = await resolveAccountByNameAndPlatform(q, platformRaw);

  if (!result.ok) {
    const status = result.status === 404 ? 404 : result.status;
    return NextResponse.json({ error: result.error ?? "Cuenta no encontrada" }, { status });
  }

  return NextResponse.json(result.body);
}
