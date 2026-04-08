import type { ChampionPageTips } from "@/lib/mashups/championPageInfo";

export function ChampionTipsCard({ displayName, tips }: { displayName: string; tips: ChampionPageTips }) {
  return (
    <div className="mt-6 rounded-2xl border border-emerald-500/25 bg-[#0d1f18]/80 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-emerald-100/95">Notas — {displayName}</h2>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-[#c8e6d9]">
        {tips.bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[#6a8a7c]">
        Para notas por rival (matchup), usa los enlaces de abajo. Este bloque se edita en{" "}
        <code className="text-emerald-400/90">lib/mashups/championPageInfo.ts</code>.
      </p>
    </div>
  );
}
