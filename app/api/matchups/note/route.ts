import { NextResponse } from "next/server";
import { getDb, upsertMatchupNote } from "@/lib/db";
import { getChampionBySlug } from "@/lib/mashups/champions";

export const dynamic = "force-dynamic";

function authorize(req: Request): boolean {
  const secret = process.env.ADMIN_WRITE_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === secret;
}

/** API opcional para scripts (curl) con ADMIN_WRITE_SECRET */
export async function PUT(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: { championSlug?: string; opponentSlug?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const cs = body.championSlug;
  const os = body.opponentSlug;
  if (!cs || !os) {
    return NextResponse.json({ error: "Faltan championSlug u opponentSlug" }, { status: 400 });
  }
  const champ = getChampionBySlug(cs);
  const opp = getChampionBySlug(os);
  if (!champ || !opp) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }
  getDb();
  upsertMatchupNote(champ.slug, opp.slug, typeof body.body === "string" ? body.body : "");
  return NextResponse.json({ ok: true });
}
