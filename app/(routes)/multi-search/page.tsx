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
                <div key={idx} className="rounded-lg bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-lg hover:shadow-purple-500/10 transition-all">
                  {player.error ? (
                    <div className="text-center py-4">
                      <div className="text-red-400 font-medium">{player.error}</div>
                      <div className="text-gray-400 text-sm mt-1">
                        {player.name}#{player.tag}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {/* Icono de perfil */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-purple-900/30 flex-shrink-0">
                        {player.profileIconId ? (
                          // eslint-disable-next-line @next/next/no-img-element
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

                      {/* Información del jugador */}
                      <div className="flex-1">
                        <div className="text-xl font-bold text-white">
                          {player.name}
                          <span className="text-purple-300">#{player.tag}</span>
                        </div>
                        <div className="text-gray-300 mt-1">
                          {player.region} • Nivel {player.level}
                        </div>
                        <div className="text-gray-500 text-sm mt-2">
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
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}