import { notFound } from "next/navigation";
import SummonerProfileClient from "@/components/summoner/SummonerProfileClient";
import DisplayAd from "@/components/ads/DisplayAd";
import { isRiotPlatform } from "@/lib/riot/platforms";

export default async function SummonerPage({
  params,
}: {
  params: Promise<{ platform: string; gameName: string; tagLine: string }>;
}) {
  const { platform, gameName, tagLine } = await params;
  const pl = platform.toLowerCase();
  if (!isRiotPlatform(pl)) notFound();

  return (
    <div>
      <SummonerProfileClient
        platform={pl}
        gameName={decodeURIComponent(gameName)}
        tagLine={decodeURIComponent(tagLine)}
      />
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <DisplayAd />
      </div>
    </div>
  );
}
