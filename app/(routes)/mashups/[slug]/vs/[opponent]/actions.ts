"use server";

import { revalidatePath } from "next/cache";
import { getDb, upsertMatchupNote } from "@/lib/db";
import { getChampionBySlug } from "@/lib/mashups/champions";

export async function saveMatchupNoteAction(input: {
  championSlug: string;
  opponentSlug: string;
  body: string;
}) {
  const champ = getChampionBySlug(input.championSlug);
  const opp = getChampionBySlug(input.opponentSlug);
  if (!champ || !opp) {
    return { ok: false as const, error: "Campeón inválido" };
  }
  try {
    getDb();
    upsertMatchupNote(champ.slug, opp.slug, input.body);
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Error al escribir la base de datos (comprueba que la carpeta data/ sea escribible y SQLITE_PATH si usas VPS).";
    console.error("[saveMatchupNoteAction]", e);
    return { ok: false as const, error: msg };
  }
  revalidatePath(`/mashups/${champ.slug}`);
  revalidatePath(`/mashups/${champ.slug}/vs/${opp.slug}`);
  return { ok: true as const };
}
