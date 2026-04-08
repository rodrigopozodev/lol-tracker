const RANK_TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

export function parseRankText(text?: string): { name: string; lp: string } {
  if (!text || text === "Unranked") return { name: "Unranked", lp: "" };
  const m = text.match(/^(.*?)(?:\s*[\-–]\s*)?(\d+\s*LP)$/i);
  if (m) return { name: m[1].trim(), lp: m[2].trim() };
  const m2 = text.match(/^(.*?)(\s+\d+\s*LP)$/i);
  if (m2) return { name: m2[1].trim(), lp: m2[2].trim() };
  return { name: text, lp: "" };
}

/** Puntuación lineal aproximada (Iron IV ≈ 0, Challenger ≈ tope). */
export function rankStringToTierScore(text: string | undefined): number | null {
  if (!text || text === "Unranked") return null;
  const upper = text.toUpperCase();
  for (let i = RANK_TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = RANK_TIER_ORDER[i];
    if (!upper.includes(tier)) continue;
    if (i >= 7) return i * 4;
    const divMatch = upper.match(/\b(IV|III|II|I)\b/);
    let div = 4;
    if (divMatch) {
      const d = divMatch[1];
      const map: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };
      div = map[d] ?? 4;
    }
    return i * 4 + (4 - div);
  }
  return null;
}

export function tierScoreToAvgLabel(avg: number): string {
  const idx = Math.min(RANK_TIER_ORDER.length - 1, Math.max(0, Math.floor(avg / 4)));
  const within = avg - idx * 4;
  const tier = RANK_TIER_ORDER[idx];
  if (idx >= 7) {
    if (tier === "MASTER") return "Master+";
    if (tier === "GRANDMASTER") return "Grandmaster";
    return "Challenger";
  }
  const div = Math.max(1, Math.min(4, Math.round(4 - within)));
  const roman = div === 1 ? "I" : div === 2 ? "II" : div === 3 ? "III" : "IV";
  const pretty = tier.charAt(0) + tier.slice(1).toLowerCase();
  return `${pretty} ${roman}`;
}
