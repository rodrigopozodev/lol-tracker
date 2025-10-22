"use client";
import React, { useState, useEffect } from "react";
import DashboardLines from "@/components/DashboardLines";
import DashboardNav from "@/components/layout/DashboardNav";

function clusterToLabel(cluster?: string | null) {
  const map: Record<string, string> = {
    euw1: "EUW",
    eun1: "EUNE",
    na1: "NA",
    kr: "KR",
    br1: "BR",
    la1: "LAS",
    la2: "LAN",
    jp1: "JP",
    oc1: "OCE",
    ru: "RU",
    tr1: "TR",
  };
  return (cluster && map[cluster]) || "—";
}

type PlayerResult = {
  name: string;
  tag: string;
  region: string;
  level: number | null;
  profileIconId: number | null;
  puuid?: string | null;
  soloRank?: string;
  flexRank?: string;
  soloIconUrl?: string | null;
  flexIconUrl?: string | null;
  error?: string;
};

function PlayerCard({ player }: { player: PlayerResult }) {
  const [tab, setTab] = useState<"solo" | "flex">(
    player.soloRank && player.soloRank !== "Unranked" ? "solo" : "flex"
  );
  const [matches, setMatches] = useState<any[]>([]);
const [masteries, setMasteries] = useState<any[]>([]);
  const hasPuuid = typeof player.puuid === "string" && player.puuid?.length! > 0;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasPuuid) return;
      try {
        const res = await fetch(`/api/riot/matches?puuid=${encodeURIComponent(player.puuid as string)}&count=10`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && Array.isArray(json?.matches)) {
          setMatches(json.matches);
        }
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [player.puuid, hasPuuid]);

// Obtener top 4 maestrías
useEffect(() => {
  if (!hasPuuid) return;
  const controller = new AbortController();
  (async () => {
    try {
      const res = await fetch(`/api/riot/masteries?puuid=${encodeURIComponent(player.puuid!)}&count=4`, { signal: controller.signal });
      const json = await res.json();
      if (json?.masteries) setMasteries(json.masteries);
    } catch {}
  })();
  return () => controller.abort();
}, [player.puuid, hasPuuid]);
  // Helper para separar nombre de rango y LP
  function parseRankText(text?: string) {
    if (!text || text === "Unranked") return { name: "Unranked", lp: "" };
    const m = text.match(/^(.*?)(?:\s*[\-–]\s*)?(\d+\s*LP)$/i);
    if (m) return { name: m[1].trim(), lp: m[2].trim() };
    const m2 = text.match(/^(.*?)(\s+\d+\s*LP)$/i);
    if (m2) return { name: m2[1].trim(), lp: m2[2].trim() };
    return { name: text, lp: "" };
  }
  const formatPts = (n: number) => new Intl.NumberFormat('es-ES').format(Math.max(0, Number(n || 0)));
  const soloMatches = matches.filter((m) => m?.queueId === 420);
  const flexMatches = matches.filter((m) => m?.queueId === 440);
  const sortByTimeDesc = (a: any, b: any) => {
    const ta = a?.gameEndTimestamp ?? a?.gameCreation ?? a?.endTime ?? a?.timestamp ?? 0;
    const tb = b?.gameEndTimestamp ?? b?.gameCreation ?? b?.endTime ?? b?.timestamp ?? 0;
    return tb - ta;
  };
  const selectedMatches = (tab === "solo" ? soloMatches : flexMatches).sort(sortByTimeDesc).slice(0, 5);

  return (
    <div className="rounded-lg bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-lg hover:shadow-purple-500/10 transition-all">
      <div className="grid grid-cols-1 md:grid-cols-[auto_auto_1fr] items-start md:items-start gap-6">
       {/* Columna 1: perfil + maestrías */}
<div className="flex flex-col gap-4">
  <div className="flex items-center gap-4">
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-purple-900/30 flex-shrink-0">
      {player.profileIconId ? (
        <img
          alt="Icono de perfil"
          src={`https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${player.profileIconId}.png`}
          width={64}
          height={64}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).onerror = null;
            (e.currentTarget as HTMLImageElement).src = "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/0.png";
          }}
        />
      ) : (
        <div className="w-full h-full bg-purple-900/50 flex items-center justify-center">
          <span className="text-purple-300 text-xl">?</span>
        </div>
      )}
    </div>

    <div className="flex-1">
      <div className="text-xl font-bold text-white text-center">
        {player.name}
        <span className="text-purple-300">#{player.tag}</span>
      </div>
      <div className="text-gray-300 mt-1 text-center">
        {player.region} • Nivel {player.level}
      </div>
      <div className="text-gray-500 text-sm mt-2 text-center">
        Actualizado: {new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  </div>

  {/* Maestrías simplificadas y centradas */}
  <div className="text-center mt-2">
<div className="text-sm font-semibold text-white mb-2">Maestrías</div>
    {masteries && masteries.length > 0 ? (
      <div className="flex justify-center gap-4">
        {masteries.slice(0, 4).map((c) => (
          <div key={c.championId ?? c.championAlias} className="flex flex-col items-center">
            {c.championAlias ? (
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/${c.championAlias}.png`}
                alt={c.championName || "Campeón"}
                width={40}
                height={40}
                className="w-10 h-10 rounded object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
              />
            ) : (
              <div className="w-10 h-10 rounded bg-purple-900/30" />
            )}
            <div className="mt-1 text-xs text-purple-200 font-semibold">{c.championLevel ?? '-'}</div>
            <div className="mt-1 text-sm text-white font-semibold">{c.championName ?? 'Desconocido'}</div>
            <div className="text-xs text-[color:var(--color-form-placeholder)]">{formatPts(c.championPoints)} pts</div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-xs text-[color:var(--color-form-placeholder)]">Cargando maestrías...</div>
    )}
  </div>
</div>

{/* Columna 2: rangos en horizontal y centrados */}
<div className="flex justify-center items-start gap-8 md:min-w-[260px] text-center">
  {/* Solo/Duo */}
  <div className="flex flex-col items-center">
    <div className="mb-3 text-base text-gray-400 font-medium">Solo/Duo</div>
    {player.soloIconUrl && player.soloRank !== "Unranked" ? (
      <>
        <img
          src={player.soloIconUrl || ''}
          alt="Rango Solo"
          width={90}
          height={90}
          className="w-24 h-24 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="mt-3 text-lg text-white font-semibold text-center">
          {parseRankText(player.soloRank).name}
        </div>
        {parseRankText(player.soloRank).lp ? (
          <div className="text-sm text-purple-200">{parseRankText(player.soloRank).lp}</div>
        ) : null}
      </>
    ) : (
      <div className="text-lg text-gray-400">Unranked</div>
    )}
  </div>

  {/* Flex */}
  <div className="flex flex-col items-center">
    <div className="mb-3 text-base text-gray-400 font-medium">Flex</div>
    {player.flexIconUrl && player.flexRank !== "Unranked" ? (
      <>
        <img
          src={player.flexIconUrl || ''}
          alt="Rango Flex"
          width={90}
          height={90}
          className="w-24 h-24 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="mt-3 text-lg text-white font-semibold text-center">
          {parseRankText(player.flexRank).name}
        </div>
        {parseRankText(player.flexRank).lp ? (
          <div className="text-sm text-purple-200">{parseRankText(player.flexRank).lp}</div>
        ) : null}
      </>
    ) : (
      <div className="text-lg text-gray-400">Unranked</div>
    )}
  </div>
</div>


{/* Columna 3: partidas con selector centrado arriba y scroll limitado */}
<div className="flex flex-col items-center gap-3">
  <div className="flex justify-center gap-3">
    <button
      type="button"
      onClick={() => setTab("solo")}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
        tab === "solo"
          ? "bg-purple-600 text-white"
          : "bg-purple-900/30 text-purple-200 border border-purple-500/30"
      }`}
    >
      Solo/Q
    </button>
    <button
      type="button"
      onClick={() => setTab("flex")}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
        tab === "flex"
          ? "bg-purple-600 text-white"
          : "bg-purple-900/30 text-purple-200 border border-purple-500/30"
      }`}
    >
      Flex
    </button>
  </div>

  <div className="rounded-xl border border-white/10 bg-white/5 p-4 w-full max-h-[175px] overflow-y-auto">
    {selectedMatches && selectedMatches.length > 0 ? (
      <ul className="grid gap-3 pr-1">
        {selectedMatches.map((m) => (
          <li key={m.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`px-2 py-1 rounded text-xs ${
                  m.win ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {m.win ? "Victoria" : "Derrota"}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.21.1/img/champion/${
                  m.champion || "Unknown"
                }.png`}
                alt={m.champion || "Campeón"}
                width={28}
                height={28}
                className="w-7 h-7 rounded object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                }}
              />
            </div>
            {typeof m.kills === "number" &&
            typeof m.deaths === "number" &&
            typeof m.assists === "number" ? (
              <div className="text-xs text-[color:var(--color-form-placeholder)]">
                {`${m.kills}/${m.deaths}/${m.assists}`}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-[color:var(--color-form-placeholder)]">
        No hay partidas recientes.
      </p>
    )}
  </div>
</div>

      </div>
    </div>
  );
}

export default function MultiSearchPage() {
  const [players, setPlayers] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);

  // Añadir input vacío cuando el último se llena
  useEffect(() => {
    const lastPlayer = players[players.length - 1];
    if (lastPlayer.trim() && players.length < 10) { // Límite de 10 jugadores
      setPlayers([...players, ""]);
    }
  }, [players]);

  const updatePlayer = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
    
    // Limpiar error cuando el usuario empiece a escribir
    if (error) {
      setError(null);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const submit = async () => {
    const validPlayers = players.filter(p => {
      const trimmed = p.trim();
      return trimmed && trimmed.includes('#') && trimmed.split('#').length === 2 && trimmed.split('#')[0].length > 0 && trimmed.split('#')[1].length > 0;
    });
    
    if (validPlayers.length === 0) {
      setError("Añade al menos un jugador con formato válido: Nombre#TAG");
      return;
    }

    setError(null);
    setLoading(true);
    setResults(null);
    
    try {
      const names = validPlayers.join(',');
      const res = await fetch(`/api/riot/multi-search?names=${encodeURIComponent(names)}&region=euw1`);
      
      if (!res.ok) {
        if (res.status === 429) {
          setError("Demasiadas peticiones. Intenta de nuevo en unos segundos.");
        } else if (res.status >= 500) {
          setError("Error del servidor. Intenta de nuevo más tarde.");
        } else {
          const json = await res.json();
          setError(json?.error || "Error consultando jugadores");
        }
        return;
      }
      
      const json = await res.json();
      setResults(Array.isArray(json) ? json : []);
      
      // Si no hay resultados válidos, mostrar mensaje
      if (Array.isArray(json) && json.length === 0) {
        setError("No se encontraron jugadores con los nombres proporcionados.");
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError("La búsqueda fue cancelada.");
      } else if (!navigator.onLine) {
        setError("Sin conexión a internet. Verifica tu conexión.");
      } else {
        setError("Error de conexión. Verifica tu conexión a internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <DashboardLines />
      </div>
      <section className="relative z-10 mx-auto w-full max-w-4xl px-3 sm:px-6 py-6">
        <DashboardNav />

        <div className="mt-8">

          {/* Contenedor de inputs */}
          <div className="space-y-4 mb-8">
            {players.map((player, index) => (
              <div key={index} className="relative">
                <input
                  type="text"
                  value={player}
                  onChange={(e) => updatePlayer(index, e.target.value)}
                  placeholder="Jugador#TAG"
                  className="w-full px-4 py-3 rounded-lg bg-[#1a0b2e] border border-purple-500/30 text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
                {players.length > 1 && player.trim() && (
                  <button
                    onClick={() => removePlayer(index)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botón de búsqueda */}
          <button
            onClick={submit}
            disabled={loading || players.filter(p => {
              const trimmed = p.trim();
              return trimmed && trimmed.includes('#') && trimmed.split('#').length === 2 && trimmed.split('#')[0].length > 0 && trimmed.split('#')[1].length > 0;
            }).length === 0}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold text-lg hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Buscando invocadores...
              </div>
            ) : (
              "Buscar invocadores"
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Resultados */}
          {results && results.length > 0 && (
            <div className="mt-8 space-y-4">
              {results.map((player, idx) => (
                player.error ? (
                  <div key={idx} className="rounded-lg bg-[#1a0b2e] border border-purple-500/30 p-6 text-center">
                    <div className="text-red-400 font-medium">{player.error}</div>
                    <div className="text-gray-400 text-sm mt-1">
                      {player.name}#{player.tag}
                    </div>
                  </div>
                ) : (
                  <PlayerCard key={idx} player={player as PlayerResult} />
                )
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}