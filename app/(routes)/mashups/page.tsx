import Link from "next/link";
import DashboardNav from "@/components/layout/DashboardNav";
import { MASHUP_CHAMPIONS } from "@/lib/mashups/champions";

export default function MashupsIndexPage() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <section className="relative z-10 mx-auto w-full max-w-none px-4 py-6 sm:px-8 lg:px-12">
        <DashboardNav />
        <h1 className="mt-8 text-2xl font-bold text-white">Mashups</h1>
        <p className="mt-2 text-sm text-[#B8A9C9]">
          Notas de matchup por campeón. Elige un campeón para ver y editar consejos vs rivales.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {MASHUP_CHAMPIONS.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/mashups/${c.slug}`}
                className="block rounded-xl border border-purple-500/30 bg-[#1a0b2e] px-5 py-4 font-semibold text-white transition hover:border-purple-400"
              >
                {c.displayName}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
