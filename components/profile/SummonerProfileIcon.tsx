"use client";

export function SummonerProfileIcon({
  profileIconId,
  suppressExternalAssets = false,
}: {
  profileIconId: number | null;
  /** Sin peticiones a Data Dragon (solo placeholder local). */
  suppressExternalAssets?: boolean;
}) {
  if (profileIconId == null || suppressExternalAssets) {
    return (
      <div className="flex h-full w-full items-center justify-center text-2xl text-purple-400">?</div>
    );
  }
  return (
    <img
      alt="Icono de invocador"
      src={`https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${profileIconId}.png`}
      width={80}
      height={80}
      className="h-full w-full object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).onerror = null;
        (e.currentTarget as HTMLImageElement).src =
          "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/0.png";
      }}
    />
  );
}
