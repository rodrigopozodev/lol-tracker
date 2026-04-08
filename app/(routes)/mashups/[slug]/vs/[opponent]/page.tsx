import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardNav from "@/components/layout/DashboardNav";
import { getDb, getMatchupNote } from "@/lib/db";
import { getChampionBySlug } from "@/lib/mashups/champions";
import { MatchupNoteForm } from "./MatchupNoteForm";

export default async function MashupVsPage({
  params,
}: {
  params: Promise<{ slug: string; opponent: string }>;
}) {
  const { slug, opponent } = await params;
  const champ = getChampionBySlug(slug);
  const opp = getChampionBySlug(opponent);
  if (!champ || !opp) notFound();

  getDb();
  const note = getMatchupNote(champ.slug, opp.slug);

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <section className="relative z-10 mx-auto w-full max-w-none px-4 py-6 sm:px-8 lg:px-12">
        <DashboardNav />
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link href="/mashups" className="text-purple-300 hover:text-purple-200">
            Mashups
          </Link>
          <span className="text-white/30">/</span>
          <Link href={`/mashups/${champ.slug}`} className="text-purple-300 hover:text-purple-200">
            {champ.displayName}
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">
          {champ.displayName} vs {opp.displayName}
        </h1>
        <p className="mt-2 text-sm text-[#B8A9C9]">
          Nota persistente en SQLite. Última edición:{" "}
          {note
            ? new Date(note.updated_at).toLocaleString("es-ES")
            : "nunca"}
        </p>
        <div className="mt-8">
          <MatchupNoteForm
            championSlug={champ.slug}
            opponentSlug={opp.slug}
            initialBody={note?.body ?? ""}
          />
        </div>
      </section>
    </main>
  );
}
