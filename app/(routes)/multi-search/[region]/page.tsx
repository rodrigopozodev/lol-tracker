"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import DashboardNav from "@/components/layout/DashboardNav";
import DashboardLines from "@/components/DashboardLines";

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

function slugToCluster(slug: string) {
  const s = slug?.toLowerCase?.() || "euw";
  const map: Record<string, string> = {
    euw: "euw1",
    eune: "eun1",
    na: "na1",
    kr: "kr",
    br: "br1",
    las: "la1",
    lan: "la2",
    jp: "jp1",
    oce: "oc1",
    ru: "ru",
    tr: "tr1",
  };
  return map[s] || "euw1";
}

export default function MultiSearchRegionPage() {
  const params = useParams();
  const search = useSearchParams();
  const regionParam = String(params?.region || "euw").toUpperCase();
  const regionSlug = String(params?.region || "euw");
  const initialSummoners = search.get("summoners") || "";

  const decodedList = useMemo(() => {
    return initialSummoners ? decodeURIComponent(initialSummoners.replace(/\+/g, " ")) : "";
  }, [initialSummoners]);

  const [text, setText] = useState(decodedList);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const autoFetched = useRef(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    setResults(null);
    try {
      const cluster = slugToCluster(regionSlug);
      const url = `/api/riot/multi-search?summoners=${encodeURIComponent(text)}&region=${cluster}`;
      const res = await fetch(url, { method: "GET" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Error consultando jugadores");
      } else {
        setResults(Array.isArray(json?.results) ? json.results : []);
      }
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoFetched.current && decodedList) {
      autoFetched.current = true;
      // Auto-cargar si viene por enlace estilo op.gg
      submit();
    }
  }, [decodedList]);

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <DashboardLines />
      </div>
      <section className="relative z-10 mx-auto w-full max-w-6xl px-3 sm:px-6 py-6">
        <DashboardNav />

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl bg-[color:var(--color-form-bg)]/65 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/25 shadow-xl p-4">
            <h2 className="text-lg font-semibold text-[color:var(--color-form-foreground)]">Multi-search · {regionParam}</h2>
            <p className="text-sm text-[color:var(--color-form-placeholder)] mb-3">
              Formato compatible: CSV con elementos como <span className="font-mono">Nombre#TAG</span> separados por comas.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nombre#TAG, Otro Nombre#TAG, ..."
              className="w-full min-h-[140px] rounded-md bg-[color:var(--color-form-input)]/80 border border-[color:var(--color-form-border)]/40 p-3 text-[color:var(--color-form-foreground)] placeholder:text-[color:var(--color-form-placeholder)]"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={submit}
                disabled={loading || !text.trim()}
                className="px-4 py-2 rounded-md bg-[color:var(--color-form-accent)] text-[color:var(--color-form-button-foreground)] hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Buscando..." : "Buscar invocadores"}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>

          {results && (
            <div className="grid gap-3">
              {results.map((r, idx) => (
                <div key={idx} className="rounded-2xl bg-[color:var(--color-form-bg)]/65 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/25 shadow-xl p-5 sm:p-6">
                  <div className="flex items-center gap-4 sm:gap-6">
                    {r?.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt="Icono de perfil"
                        src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${r.icon}.jpg`}
                        width={72}
                        height={72}
                        className="rounded-xl object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).onerror = null;
                          (e.currentTarget as HTMLImageElement).src = "https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/0.png";
                        }}
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-xl bg-black/20" />
                    )}

                    <div className="flex-1">
                      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--color-form-foreground)]">
                        {r?.name ?? r?.gameName ?? "—"}
                        {r?.tag ? (
                          <span className="text-[color:var(--color-form-placeholder)] ml-1">#{r.tag}</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs sm:text-sm text-[color:var(--color-form-placeholder)] flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[color:var(--color-form-foreground)]/85">
                          {clusterToLabel(r?.region)}
                        </span>
                        <span>• Nivel {typeof r?.level === "number" ? r.level : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}