import { NextResponse } from "next/server";
import {
  getChampionAggregateCache,
  getDb,
  type ChampionAggregateStoredPayload,
} from "@/lib/db";
import { CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT, rebuildChampionAggregateCache } from "@/lib/championAggregatePersist";
import { getPublicRankedSeasonYear } from "@/lib/rankedSeasonYear";

export const dynamic = "force-dynamic";

function emptyPayload(perAccount: number): ChampionAggregateStoredPayload {
  return {
    seasonYear: getPublicRankedSeasonYear(),
    queues: ["Solo/Duo (420)", "Flex (440)"],
    perAccountMaxDetailCalls: perAccount,
    truncated: false,
    accountNotes: [],
    errors: [],
    top: [],
  };
}

/** Solo SQLite: no consume la API de Riot. */
export async function GET(req: Request) {
  getDb();
  const { searchParams } = new URL(req.url);
  const perRaw = searchParams.get("perAccount");
  const perAccount = Math.min(
    200,
    Math.max(
      10,
      parseInt(perRaw || String(CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT), 10) ||
        CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT
    )
  );

  const cached = getChampionAggregateCache();
  if (!cached) {
    return NextResponse.json({
      source: "none" as const,
      computedAt: null as number | null,
      ...emptyPayload(perAccount),
    });
  }

  return NextResponse.json({
    source: "cache" as const,
    computedAt: cached.capturedAt,
    ...cached.payload,
  });
}

/** Recalcula con Riot y guarda en SQLite. */
export async function POST(req: Request) {
  getDb();
  let perAccount = CHAMPION_AGGREGATE_DEFAULT_PER_ACCOUNT;
  try {
    const body = (await req.json()) as { perAccount?: number } | null;
    const n = body?.perAccount;
    if (typeof n === "number" && Number.isFinite(n)) {
      perAccount = Math.min(200, Math.max(10, Math.floor(n)));
    }
  } catch {
    /* body opcional */
  }

  const started = Date.now();
  const rebuild = await rebuildChampionAggregateCache(perAccount);
  const durationMs = Date.now() - started;

  if (!rebuild.ok) {
    console.error(
      `[champion-aggregate] ERROR tras ${durationMs}ms · perAccount=${perAccount} · ${rebuild.error}`
    );
    return NextResponse.json({ error: rebuild.error, durationMs }, { status: 500 });
  }

  const iso = new Date(rebuild.capturedAt).toISOString();
  const accountsProcessed = rebuild.payload.accountNotes.filter((n) => n.detailCalls > 0).length;
  console.log(
    `[champion-aggregate] OK · ${durationMs}ms · ${iso} · perAccount=${perAccount} · cuentas con datos: ${accountsProcessed} · top: ${rebuild.payload.top.length} filas · SQLite actualizado`
  );
  if (rebuild.payload.truncated) {
    console.warn(
      `[champion-aggregate] Aviso: alguna cuenta alcanzó el límite de partidas revisadas; el total por campeón puede quedar por debajo de las partidas reales (sube perAccount en el POST si hace falta).`
    );
  }
  const topPreview = rebuild.payload.top
    .slice(0, 5)
    .map((r) => `${r.champion} ${r.wins}V/${r.losses}D`)
    .join(" · ");
  if (topPreview) {
    console.log(`[champion-aggregate] Top 5 (volumen ranked temporada): ${topPreview}`);
  }
  const xin = rebuild.payload.top.find((r) => r.champion === "Xin Zhao");
  if (xin) {
    console.log(
      `[champion-aggregate] Xin Zhao (Solo+Flex agregado): ${xin.wins}V ${xin.losses}D · ${xin.games} partidas · WR ${xin.winRate}%`
    );
  } else {
    console.log(
      `[champion-aggregate] Xin Zhao: no está en el top 15 por número de partidas (solo se listan los 15 con más games).`
    );
  }

  const confirmMessage = `Listo en ${durationMs / 1000 < 60 ? `${durationMs} ms` : `${Math.round(durationMs / 1000)} s`}. Caché guardada en SQLite (${iso}).`;

  return NextResponse.json({
    source: "riot" as const,
    computedAt: rebuild.capturedAt,
    durationMs,
    confirmMessage,
    ...rebuild.payload,
  });
}
