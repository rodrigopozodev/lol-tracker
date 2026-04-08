import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardNav from "@/components/layout/DashboardNav";
import { ChampionLoadoutSection } from "@/components/mashups/ChampionLoadoutSection";
import { getLatestDdragonVersion } from "@/lib/ddAssets";
import { getDb, listMatchupNotesForChampion } from "@/lib/db";
import { MASHUP_CHAMPIONS, getChampionBySlug } from "@/lib/mashups/champions";
import { getChampionPageTips } from "@/lib/mashups/championPageInfo";
import { getLoadoutForSlug } from "@/lib/mashups/loadoutData";
import { ChampionTipsCard } from "@/components/mashups/ChampionTipsCard";

export default async function MashupChampionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const champ = getChampionBySlug(slug);
  if (!champ) notFound();

  const version = await getLatestDdragonVersion();
  const loadout = getLoadoutForSlug(champ.slug);
  const pageTips = getChampionPageTips(champ.slug);

  getDb();
  const notes = listMatchupNotesForChampion(champ.slug);
  const others = MASHUP_CHAMPIONS.filter((c) => c.slug !== champ.slug);

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <section className="relative z-10 mx-auto w-full max-w-6xl px-3 py-6 sm:px-6">
        <DashboardNav />
        <Link href="/mashups" className="mt-6 inline-block text-sm text-purple-300 hover:text-purple-200">
          ← Mashups
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">{champ.displayName}</h1>
        <p className="mt-2 text-sm text-[#B8A9C9]">
          Matchups documentados y enlaces rápidos para añadir notas vs rivales.
        </p>

        {pageTips && <ChampionTipsCard displayName={champ.displayName} tips={pageTips} />}

        {loadout && (
          <ChampionLoadoutSection
            version={version}
            displayName={champ.displayName}
            loadout={loadout}
            championSlug={champ.slug}
          />
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white">Notas guardadas</h2>
          {notes.length === 0 ? (
            <p className="mt-2 text-sm text-[#B8A9C9]">Aún no hay notas. Crea una desde los enlaces de abajo.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((n) => (
                <li key={n.opponent_slug}>
                  <Link
                    href={`/mashups/${champ.slug}/vs/${n.opponent_slug}`}
                    className="text-purple-300 hover:text-purple-200"
                  >
                    vs {n.opponent_slug} — editar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">Añadir / editar matchup</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/mashups/${champ.slug}/vs/${o.slug}`}
                  className="block rounded-lg border border-white/10 bg-[#1a0b2e] px-4 py-3 text-sm text-white hover:border-purple-500/40"
                >
                  vs {o.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
