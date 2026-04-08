"use client";

import { useState } from "react";
import type { CountersSynergyCells, StrongAgainstByRole, SynergyPickEntry } from "@/lib/mashups/loadoutData";
import { GoodSynergyPartnerBoard, StrongAgainstRoleBoard } from "./MashupMatchupBoard";

/** Pestañas: estilo segmentado (púrpura), no barra plana tipo analytics. */
function tabBtn(active: boolean) {
  return `rounded-lg px-3 py-2 text-center text-[11px] font-medium transition-colors sm:text-xs ${
    active
      ? "bg-purple-600/85 text-white shadow-md shadow-purple-900/40"
      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
  }`;
}

const panelShell = "rounded-2xl border border-purple-500/20 bg-[#0f0818]/95 shadow-inner shadow-black/30";

type Tab = "common" | "strong" | "weak";

export function CountersSynergyPanel({
  data,
  version,
  strongAgainstByRole,
  goodSynergyChampions,
}: {
  data: CountersSynergyCells;
  version: string;
  strongAgainstByRole?: StrongAgainstByRole;
  goodSynergyChampions?: SynergyPickEntry[];
}) {
  const [tab, setTab] = useState<Tab>("strong");
  const { counters, synergy } = data;

  return (
    <div className={`${panelShell} overflow-hidden`}>
      <div className="min-w-[280px]">
        <div className="flex flex-col gap-2 border-b border-purple-500/15 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-purple-200/80">
            Rivales (línea)
          </span>
          <div className="flex flex-1 flex-wrap gap-1 rounded-xl bg-black/35 p-1 sm:justify-end">
            <button type="button" className={tabBtn(tab === "common")} onClick={() => setTab("common")}>
              Matchup habitual
            </button>
            <button type="button" className={tabBtn(tab === "strong")} onClick={() => setTab("strong")}>
              Ventaja
            </button>
            <button type="button" className={tabBtn(tab === "weak")} onClick={() => setTab("weak")}>
              Desventaja
            </button>
          </div>
        </div>
        <div className="p-3 text-[11px] leading-snug text-[#c9bdd9] sm:p-4">
          {tab === "common" && <p>{counters.commonMatchup?.trim() || "—"}</p>}
          {tab === "strong" && (
            <>
              {strongAgainstByRole ? (
                <StrongAgainstRoleBoard version={version} byRole={strongAgainstByRole} />
              ) : (
                <p>{counters.strongAgainst?.trim() || "—"}</p>
              )}
            </>
          )}
          {tab === "weak" && <p>{counters.weakAgainst?.trim() || "—"}</p>}
        </div>
      </div>

      <div className="min-w-[280px] border-t border-purple-500/15">
        <div className="p-3 sm:p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-200/80">Compañeros</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-purple-500/15 bg-black/25 p-2">
              <p className="mb-2 border-b border-white/5 pb-1.5 text-center text-[10px] font-medium text-purple-300/90">
                Buena sinergia
              </p>
              <div className="text-[11px] text-[#dce8ea]">
                {goodSynergyChampions && goodSynergyChampions.length > 0 ? (
                  <GoodSynergyPartnerBoard version={version} champions={goodSynergyChampions} />
                ) : (
                  <p className="py-2 text-center text-[#8a7a9a]">{synergy.goodSynergy || "—"}</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-purple-500/15 bg-black/25 p-2">
              <p className="mb-2 border-b border-white/5 pb-1.5 text-center text-[10px] font-medium text-purple-300/90">
                Mala sinergia
              </p>
              <p className="py-2 text-center text-[11px] text-[#dce8ea]">{synergy.badSynergy || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
