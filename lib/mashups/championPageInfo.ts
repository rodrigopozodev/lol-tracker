/**
 * Texto fijo por campeón en /mashups/[slug] (sinergias, matchup general, etc.).
 * Edita aquí o amplía el tipo si necesitas más campos.
 */

export type ChampionPageTips = {
  /** Viñetas breves (se muestran como lista) */
  bullets: string[];
};

const TIPS: Partial<Record<string, ChampionPageTips>> = {
  "xin-zhao": {
    bullets: [
      "Buen matchup contra Vel'Koz en mid o en support: es frágil, depende de encadenar skillshots y tú cierras con E + W.",
      "En teamfights, no corras en línea hacia él; flanquea o usa un ángulo donde ya haya gastado Q o E.",
    ],
  },
};

export function getChampionPageTips(slug: string): ChampionPageTips | null {
  return TIPS[slug.toLowerCase()] ?? null;
}
