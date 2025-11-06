"use client";
import React, { useState } from "react";
import ProfileIcon from "@/components/home/ProfileIcon";
import RankSwitcher from "@/components/home/RankSwitcher";

type LeagueEntry = {
  queue?: string | null;
  tier?: string | null;
  rank?: string | null;
  leaguePoints?: number | null;
  wins?: number | null;
  losses?: number | null;
};

type SearchResult = {
  name: string;
  tag: string;
  region: string | null;
  level: number | null;
  profileIconId: number | null;
  puuid: string;
};

export default function PublicSearch() {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [solo, setSolo] = useState<LeagueEntry | null>(null);
  const [flex, setFlex] = useState<LeagueEntry | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    setSolo(null);
    setFlex(null);
    try {
      const namesParam = encodeURIComponent(`${gameName}#${tagLine}`);
      const res = await fetch(`/api/riot/multi-search?names=${namesParam}`, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error buscando invocador");
      }
      const list = await res.json();
      const item = Array.isArray(list) ? list[0] : null;
      if (!item || item.error || !item.puuid) {
        throw new Error(item?.error || "Invocador no encontrado");
      }
      const mapped: SearchResult = {
        name: item.name,
        tag: item.tag,
        region: item.region || null,
        level: item.level ?? null,
        profileIconId: item.profileIconId ?? null,
        puuid: item.puuid,
      };
      setResult(mapped);

      // Obtener ranking Solo/Flex con shape compatible con RankSwitcher
      const lr = await fetch(`/api/riot/league?puuid=${encodeURIComponent(item.puuid)}`, { cache: "no-store" });
      if (lr.ok) {
        const lj = await lr.json();
        setSolo(lj?.solo || null);
        setFlex(lj?.flex || null);
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!result) return;
    // Mantener la tarjeta visible mientras refresca
    setLoading(true);
    setError(null);
    try {
      const namesParam = encodeURIComponent(`${gameName}#${tagLine}`);
      const res = await fetch(`/api/riot/multi-search?names=${namesParam}`, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error actualizando datos");
      }
      const list = await res.json();
      const item = Array.isArray(list) ? list[0] : null;
      if (!item || item.error || !item.puuid) {
        throw new Error(item?.error || "Invocador no encontrado");
      }
      setResult({
        name: item.name,
        tag: item.tag,
        region: item.region || null,
        level: item.level ?? null,
        profileIconId: item.profileIconId ?? null,
        puuid: item.puuid,
      });
      const lr = await fetch(`/api/riot/league?puuid=${encodeURIComponent(item.puuid)}`, { cache: "no-store" });
      if (lr.ok) {
        const lj = await lr.json();
        setSolo(lj?.solo || null);
        setFlex(lj?.flex || null);
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const profileIconUrl = result?.profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${result.profileIconId}.png`
    : null;

  return (
    <div className="mt-4">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-sm text-[#B8A9C9] mb-1">Riot ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="GameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="flex-1 rounded-xl bg-[#1a0b2e] border border-purple-500/30 px-3 py-2 text-white placeholder:text-purple-200/50"
              required
            />
            <input
              type="text"
              placeholder="TAG (p. ej. EUW)"
              value={tagLine}
              onChange={(e) => setTagLine(e.target.value)}
              className="w-40 rounded-xl bg-[#1a0b2e] border border-purple-500/30 px-3 py-2 text-white placeholder:text-purple-200/50"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition disabled:opacity-60"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error ? (
        <div className="mt-3 text-sm text-red-400">{error}</div>
      ) : null}

      {result ? (
        <div className="mt-6 relative rounded-2xl bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-purple-900/30 border-2 border-purple-500/50">
              <ProfileIcon src={profileIconUrl} size={112} />
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white">
              {result.name}
              <span className="text-purple-300">#{result.tag}</span>
            </div>
            <RankSwitcher solo={solo} flex={flex} />
            <div className="text-[#B8A9C9] mt-1">
              {result.region || "—"} • Nivel {result.level ?? "—"}
            </div>
            {lastUpdated ? (
              <div className="text-[#B8A9C9]/70 text-sm">
                Actualizado: {lastUpdated.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            ) : null}
          </div>
          <div className="absolute top-4 right-4 hidden md:block">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition disabled:opacity-60"
            >
              {loading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
          <div className="block md:hidden mt-4 pt-4 border-t border-purple-500/20">
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition disabled:opacity-60"
              >
                {loading ? "Actualizando…" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}