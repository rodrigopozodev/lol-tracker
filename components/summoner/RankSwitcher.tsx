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
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setTab("solo")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${tab === "solo" ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "border border-border bg-muted text-muted-foreground"}`}
        >
          Solo/Q
        </button>
        <button
          type="button"
          onClick={() => setTab("flex")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${tab === "flex" ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "border border-border bg-muted text-muted-foreground"}`}
        >
          Flex
        </button>
      </div>

      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="Rango" width={120} height={120} className="w-24 h-24 md:w-30 md:h-30 object-contain" />
      ) : null}

      <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/12 to-orange-400/15 px-4 py-2">
        <span className="text-sm font-semibold text-foreground md:text-base">{label}</span>
      </div>

      {wl ? (
        <div className="text-sm text-muted-foreground">{wl}</div>
      ) : (
        <div className="text-sm text-muted-foreground/70">Sin datos</div>
      )}
    </div>
  );
}
