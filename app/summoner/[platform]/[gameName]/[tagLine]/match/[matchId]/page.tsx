import { Suspense } from "react";
import { notFound } from "next/navigation";
import MatchDetailClient from "@/components/summoner/MatchDetailClient";
import { isRiotPlatform } from "@/lib/riot/platforms";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ platform: string; gameName: string; tagLine: string; matchId: string }>;
}) {
  const { platform, gameName, tagLine, matchId } = await params;
  const pl = platform.toLowerCase();
  if (!isRiotPlatform(pl)) notFound();

  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-muted-foreground">Cargando partida…</div>
      }
    >
      <MatchDetailClient
        platform={pl}
        matchId={decodeURIComponent(matchId)}
        gameName={decodeURIComponent(gameName)}
        tagLine={decodeURIComponent(tagLine)}
      />
    </Suspense>
  );
}
