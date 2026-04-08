/** Año de temporada clasificatoria (alineado con NEXT_PUBLIC_RANKED_SEASON_YEAR en el cliente). */
export function getPublicRankedSeasonYear(): number {
  const n = parseInt(process.env.NEXT_PUBLIC_RANKED_SEASON_YEAR || "2026", 10);
  return Number.isFinite(n) && n >= 2000 && n <= 2100 ? n : 2026;
}
