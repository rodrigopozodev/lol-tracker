"use client";
import React, { useState } from "react";

type LeagueEntry = {
  tier?: string | null;
  rank?: string | null;
  leaguePoints?: number | null;
  wins?: number | null;
  losses?: number | null;
};

function formatLabel(entry: LeagueEntry | null): string {
  if (!entry || !entry.tier || !entry.rank) return "Unranked";
  const lp = typeof entry.leaguePoints === "number" ? `${entry.leaguePoints} LP` : "0 LP";
  return `${entry.tier} ${entry.rank} (${lp})`;
}

function iconUrl(entry: LeagueEntry | null): string | null {
  const tier = (entry?.tier || "").toString().toLowerCase();
  if (!tier) return null;
  return `https://opgg-static.akamaized.net/images/medals_new/${tier}.png`;
}

function winsLossText(entry: LeagueEntry | null): string | null {
  const wins = typeof entry?.wins === "number" ? entry!.wins! : null;
  const losses = typeof entry?.losses === "number" ? entry!.losses! : null;
  if (wins == null || losses == null) return null;
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
  return `${wins}W / ${losses}L · ${wr}% WR`;
}

export default function RankSwitcher({ solo, flex }: { solo: LeagueEntry | null; flex: LeagueEntry | null }) {
  const hasSolo = !!(solo && solo.tier && solo.rank);
  const hasFlex = !!(flex && flex.tier && flex.rank);
  const defaultTab: "solo" | "flex" = hasSolo ? "solo" : hasFlex ? "flex" : "solo";
  const [tab, setTab] = useState<"solo" | "flex">(defaultTab);

  const selected = tab === "solo" ? solo : flex;
  const label = formatLabel(selected);
  const img = iconUrl(selected);
  const wl = winsLossText(selected);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Tabs */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setTab("solo")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "solo" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-purple-900/30 text-purple-200 border border-purple-500/30"}`}
        >
          Solo/Q
        </button>
        <button
          type="button"
          onClick={() => setTab("flex")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "flex" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-purple-900/30 text-purple-200 border border-purple-500/30"}`}
        >
          Flex
        </button>
      </div>

      {/* Icon */}
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="Rango" width={120} height={120} className="w-24 h-24 md:w-30 md:h-30 object-contain" />
      ) : null}

      {/* Label */}
      <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30">
        <span className="text-white font-semibold text-sm md:text-base">{label}</span>
      </div>

      {/* W/L + WR */}
      {wl ? (
        <div className="text-[#B8A9C9] text-sm">{wl}</div>
      ) : (
        <div className="text-[#B8A9C9]/70 text-sm">Sin datos</div>
      )}
    </div>
  );
}