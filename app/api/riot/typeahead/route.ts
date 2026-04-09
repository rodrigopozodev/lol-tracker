import { NextResponse } from "next/server";
import { getDdragonCdnVersion } from "@/lib/ddragon/cdnVersion";
import { parseSingleRiotId } from "@/lib/parseRiotId";
import { resolveAccountByRiotId, riotDirectorySearch } from "@/lib/riot/accountLookupServer";
import { isRiotPlatform, type RiotPlatformId } from "@/lib/riot/platforms";
import type { SummonerSuggestion } from "@/lib/summonerSearchHistory";
import { searchTrnLolPlayers } from "@/lib/trn/trnLolSearch";
import { getTrnApiKey } from "@/lib/trnApiKey";
import { getRiotApiKey } from "@/lib/riotApiKey";

function toSummonerSuggestionFromResolved(
  body: {
    gameName: string;
    tagLine: string;
    region: string | null;
    profileIconId: number | null;
  },
  fallbackPlatform: RiotPlatformId,
  ddragonVersion: string
): SummonerSuggestion {
  const plat: RiotPlatformId =
    body.region && isRiotPlatform(body.region) ? body.region : fallbackPlatform;
  const profileIconUrl =
    body.profileIconId != null
      ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${body.profileIconId}.png`
      : null;
  return {
    riotIdLine: `${body.gameName}#${body.tagLine}`,
    platform: plat,
    profileIconUrl,
    suggestSource: "riot",
  };
}

/**
 * Typeahead estilo tracker.gg: primero Tracker Network (prefijo), si no hay clave o resultados,
 * resolución Riot en la región (nombre exacto + etiqueta típica / summoner by-name).
 */
export async function GET(req: Request) {
  const hasRiot = !!getRiotApiKey();
  const hasTrn = !!getTrnApiKey();
  if (!hasRiot) {
    return NextResponse.json({ error: "RIOT_API_KEY no configurada", results: [] }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get("q")?.trim() ?? "";
  const platformRaw = searchParams.get("platform")?.trim().toLowerCase() ?? "";

  if (!qRaw) {
    return NextResponse.json({ results: [], trnConfigured: hasTrn, trnHttpStatus: null as number | null });
  }

  if (!isRiotPlatform(platformRaw)) {
    return NextResponse.json({ error: "platform inválida", results: [] }, { status: 400 });
  }

  const platform = platformRaw;
  const ddragonVersion = await getDdragonCdnVersion();

  const parsed = parseSingleRiotId(qRaw);
  if (parsed) {
    const r = await resolveAccountByRiotId(parsed.gameName, parsed.tagLine, platform);
    if (!r.ok) {
      return NextResponse.json({
        results: [] as SummonerSuggestion[],
        trnConfigured: hasTrn,
        trnHttpStatus: null as number | null,
        notFound: true,
        error: r.error ?? null,
        riotUpstream502: r.status === 502,
      });
    }
    return NextResponse.json({
      results: [toSummonerSuggestionFromResolved(r.body, platform, ddragonVersion)],
      trnConfigured: hasTrn,
      trnHttpStatus: null as number | null,
    });
  }

  if (qRaw.includes("#")) {
    return NextResponse.json({ results: [], trnConfigured: hasTrn, trnHttpStatus: null });
  }

  if (qRaw.length < 2) {
    return NextResponse.json({ results: [], trnConfigured: hasTrn, trnHttpStatus: null });
  }

  const useTrnLookup =
    hasTrn && process.env.TRN_SKIP_LOL_SEARCH !== "1" && process.env.SKIP_TRN !== "1";

  let trnHttpStatus: number | null = null;
  let trnAuthError = false;
  if (useTrnLookup) {
    const { suggestions, httpStatus } = await searchTrnLolPlayers(qRaw, platform);
    trnHttpStatus = httpStatus || null;
    if (suggestions.length > 0) {
      return NextResponse.json({
        results: suggestions,
        trnConfigured: true,
        trnHttpStatus,
      });
    }
    if (httpStatus === 401) {
      trnAuthError = true;
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[typeahead] TRN devolvió 401: la clave no es aceptada por public-api.tracker.gg. Regenerala en developers.tracker.network, sin comillas en .env.local, y solicita acceso producción si aplica."
        );
      }
    }
  }

  const bodies = await riotDirectorySearch(qRaw, platform);
  if (bodies.length === 0) {
    return NextResponse.json({
      results: [] as SummonerSuggestion[],
      trnConfigured: hasTrn,
      trnHttpStatus,
      trnAuthError,
      notFound: true,
      error:
        trnAuthError || !useTrnLookup
          ? "Sin índice Tracker: solo aparecen cuentas cuyo nombre de invocador o Riot ID coincide exactamente con lo escrito (probamos varios shards y TAG comunes). Para prefijos tipo «grv d» → «GRV Degryh» hace falta la API de Tracker operativa."
          : null,
    });
  }

  const results = bodies.map((b) => toSummonerSuggestionFromResolved(b, platform, ddragonVersion));

  let trnAuthWarning: string | null = null;
  if (trnAuthError || !useTrnLookup) {
    trnAuthWarning =
      results.length > 1
        ? "Solo Riot: varias coincidencias en distintos shards/TAG; elige la correcta. Sin Tracker no hay prefijos tipo tracker.gg."
        : "Solo Riot (hasta varios shards y TAG comunes). Sin Tracker operativo no se resuelve «grv d» → nombre largo; usa el Riot ID completo.";
  } else if (results.length > 1) {
    trnAuthWarning = "Varias cuentas; revisa región y #TAG.";
  }

  return NextResponse.json({
    results,
    trnConfigured: hasTrn,
    trnHttpStatus,
    trnAuthError,
    trnAuthWarning,
  });
}
