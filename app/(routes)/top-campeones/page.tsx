import Link from "next/link";
import DashboardNav from "@/components/layout/DashboardNav";
import { getDb, getChampionAggregateCache } from "@/lib/db";
import { ChampionAggregatePanel } from "@/app/(routes)/home/ChampionAggregatePanel";
import Script from "next/script";

export default async function TopCampeonesPage() {
  getDb();
  const championAgg = getChampionAggregateCache();
  const championAggregateInitial = championAgg
    ? { computedAt: championAgg.capturedAt, ...championAgg.payload }
    : null;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <section className="relative z-10 mx-auto w-full max-w-none px-4 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <DashboardNav />
          <Link href="/home" className="mt-6 inline-block text-sm text-purple-300 hover:text-purple-200">
            ← Home
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Top campeones</h1>
          <p className="mt-2 text-sm text-[#B8A9C9]">
            Ranked Solo/Duo y Flex agregados en todas tus cuentas. Actualiza la caché con Riot cuando quieras
            datos nuevos.
          </p>
          <div className="mt-8">
            <ChampionAggregatePanel initial={championAggregateInitial} />
          </div>
        </div>
      </section>
      <Script
        id="adsense-top-campeones"
        strategy="afterInteractive"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7823702362685618"
        crossOrigin="anonymous"
      />
    </main>
  );
}
