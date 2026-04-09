"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProfileIcon from "@/components/summoner/ProfileIcon";
import { RIOT_PLATFORMS, type RiotPlatformId } from "@/lib/riot/platforms";
import { parseSingleRiotId } from "@/lib/parseRiotId";
import {
  addRecentSummonerSearch,
  favoritesAsSuggestions,
  getTypeaheadCacheHit,
  instantTypeaheadSuggestions,
  isFavoriteSummoner,
  recentAsSuggestions,
  rememberTypeaheadResults,
  splitRiotIdDisplay,
  summonerSuggestionDedupeKey,
  toggleFavoriteSummoner,
  TYPEAHEAD_CACHE_FRESH_MS,
  type SummonerSuggestion,
} from "@/lib/summonerSearchHistory";

type SideTab = "search" | "recent" | "favorites";

function ChevronDown(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function platformLabel(id: RiotPlatformId): string {
  return RIOT_PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M12 2l2.9 6.55L22 9.9l-5 4.35L18.18 22 12 18.9 5.82 22 7 14.25 2 9.9l7.1-1.35L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
        className={filled ? "text-primary" : "text-muted-foreground/50"}
      />
    </svg>
  );
}

export default function SummonerSearchForm() {
  const router = useRouter();
  const [platform, setPlatform] = useState<RiotPlatformId>("euw1");
  const [riotIdLine, setRiotIdLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sideTab, setSideTab] = useState<SideTab>("search");
  const [highlight, setHighlight] = useState(-1);
  const [, bumpFavorites] = useState(0);
  const [liveResults, setLiveResults] = useState<SummonerSuggestion[]>([]);
  const [liveLookup, setLiveLookup] = useState<"idle" | "loading" | "notfound" | "error">("idle");
  const [typeaheadFlags, setTypeaheadFlags] = useState<{
    trnAuthError?: boolean;
    riotUpstream502?: boolean;
    hint?: string | null;
    banner?: string | null;
  }>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const typeaheadRequestTimeoutRef = useRef<number | undefined>(undefined);

  /**
   * Typeahead estilo tracker.gg: Tracker Network (prefijo) si TRN_API_KEY está configurada;
   * si no hay resultados, Riot resuelve una cuenta en la región seleccionada.
   */
  useEffect(() => {
    const trimmed = riotIdLine.trim();
    if (!trimmed) {
      setLiveResults([]);
      setLiveLookup("idle");
      setTypeaheadFlags({});
      return;
    }

    if (trimmed.includes("#") && !parseSingleRiotId(riotIdLine)) {
      setLiveResults([]);
      setLiveLookup("idle");
      setTypeaheadFlags({});
      return;
    }

    if (!trimmed.includes("#") && trimmed.length < 2) {
      setLiveResults([]);
      setLiveLookup("idle");
      setTypeaheadFlags({});
      return;
    }

    const parsedForCache = parseSingleRiotId(trimmed);
    const cacheHit = parsedForCache
      ? getTypeaheadCacheHit(platform, `${parsedForCache.gameName}#${parsedForCache.tagLine}`)
      : null;
    const cacheFresh =
      cacheHit != null && Date.now() - cacheHit.lastOkAt < TYPEAHEAD_CACHE_FRESH_MS;

    if (cacheFresh && cacheHit) {
      setLiveResults([cacheHit.suggestion]);
      setLiveLookup("idle");
      setTypeaheadFlags({});
      return;
    }

    if (cacheHit) {
      setLiveResults([cacheHit.suggestion]);
      setLiveLookup("idle");
    }

    const ac = new AbortController();
    const timeoutAc = new AbortController();

    const debounceId = window.setTimeout(async () => {
      if (!cacheHit) {
        setLiveLookup("loading");
        setLiveResults([]);
      }
      setTypeaheadFlags({});

      typeaheadRequestTimeoutRef.current = window.setTimeout(() => timeoutAc.abort(), 14_000);
      const anySignal =
        typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function"
          ? AbortSignal.any([ac.signal, timeoutAc.signal])
          : ac.signal;

      try {
        const url = `/api/riot/typeahead?q=${encodeURIComponent(trimmed)}&platform=${encodeURIComponent(platform)}`;
        const r = await fetch(url, { signal: anySignal, cache: "no-store" });
        if (r.status === 500) {
          setLiveLookup("error");
          return;
        }
        const j = (await r.json()) as {
          results?: SummonerSuggestion[];
          notFound?: boolean;
          trnAuthError?: boolean;
          riotUpstream502?: boolean;
          trnAuthWarning?: string | null;
          error?: string | null;
        };
        const results = Array.isArray(j.results) ? j.results : [];
        setTypeaheadFlags({
          trnAuthError: !!j.trnAuthError,
          riotUpstream502: !!j.riotUpstream502,
          hint: typeof j.error === "string" ? j.error : null,
          banner: typeof j.trnAuthWarning === "string" ? j.trnAuthWarning : null,
        });
        if (results.length > 0) {
          rememberTypeaheadResults(results);
          setLiveResults(results);
          setLiveLookup("idle");
          return;
        }
        if (j.riotUpstream502) {
          setLiveLookup("error");
          return;
        }
        if (j.notFound) {
          setLiveLookup("notfound");
          return;
        }
        if (j.trnAuthError) {
          setLiveLookup("error");
          return;
        }
        setLiveLookup("idle");
      } catch {
        if (ac.signal.aborted && !timeoutAc.signal.aborted) return;
        if (timeoutAc.signal.aborted) {
          setTypeaheadFlags({
            hint: "La búsqueda tardó demasiado (muchas consultas a Riot o red lenta). Prueba con Nombre#TAG exacto, por ejemplo GRV Degryh#ESP.",
          });
          setLiveLookup("error");
          return;
        }
        setLiveLookup("error");
      } finally {
        if (typeaheadRequestTimeoutRef.current !== undefined) {
          window.clearTimeout(typeaheadRequestTimeoutRef.current);
          typeaheadRequestTimeoutRef.current = undefined;
        }
      }
    }, 380);

    return () => {
      ac.abort();
      window.clearTimeout(debounceId);
      if (typeaheadRequestTimeoutRef.current !== undefined) {
        window.clearTimeout(typeaheadRequestTimeoutRef.current);
        typeaheadRequestTimeoutRef.current = undefined;
      }
    };
  }, [riotIdLine, platform]);

  /** Prioriza cuentas del shard seleccionado (coinciden con el desplegable de región). */
  const searchResults = useMemo(() => {
    const r = [...liveResults];
    r.sort((a, b) => {
      const ap = a.platform === platform ? 0 : 1;
      const bp = b.platform === platform ? 0 : 1;
      return ap - bp;
    });
    return r;
  }, [liveResults, platform]);

  /** Sin debounce: recientes + caché local del typeahead (misma región). */
  const instantSearchResults = useMemo(
    () => instantTypeaheadSuggestions(riotIdLine, platform, 12),
    [riotIdLine, platform]
  );

  const searchTabResults = useMemo(() => {
    const seen = new Set<string>();
    const out: SummonerSuggestion[] = [];
    for (const s of instantSearchResults) {
      const k = summonerSuggestionDedupeKey(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    for (const s of searchResults) {
      const k = summonerSuggestionDedupeKey(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    return out;
  }, [instantSearchResults, searchResults]);

  const recentResults = recentAsSuggestions(15);
  const favoriteResults = favoritesAsSuggestions(20);

  const list = useMemo((): SummonerSuggestion[] => {
    if (sideTab === "search") return searchTabResults;
    if (sideTab === "recent") return recentResults;
    return favoriteResults;
  }, [sideTab, searchTabResults, recentResults, favoriteResults]);

  useEffect(() => {
    setHighlight((h) => {
      if (list.length === 0) return -1;
      if (h >= list.length) return list.length - 1;
      return h;
    });
  }, [list]);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPanelOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const goToSummoner = useCallback((s: SummonerSuggestion) => {
    const parsed = parseSingleRiotId(s.riotIdLine);
    if (!parsed) return;
    addRecentSummonerSearch(`${parsed.gameName}#${parsed.tagLine}`, s.platform);
    setPanelOpen(false);
    setHighlight(-1);
    router.push(
      `/summoner/${s.platform}/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagLine)}`
    );
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseSingleRiotId(riotIdLine);
    if (parsed) {
      addRecentSummonerSearch(`${parsed.gameName}#${parsed.tagLine}`, platform);
      setPanelOpen(false);
      router.push(
        `/summoner/${platform}/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagLine)}`
      );
      return;
    }
    const pick =
      highlight >= 0 && list[highlight] ? list[highlight] : list[0];
    if (pick) {
      goToSummoner(pick);
      return;
    }
    setError(
      "Escribe al menos 2 caracteres, el Riot ID completo (Nombre#TAG) o elige un resultado de la lista."
    );
  }

  const fieldBase =
    "min-h-11 w-full min-w-0 flex-1 border-0 bg-transparent py-1 text-base text-foreground placeholder:text-muted-foreground/65 focus:outline-none focus:ring-0";

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl space-y-3">
      <div
        ref={rootRef}
        className="overflow-hidden rounded-2xl border-2 border-white/10 bg-card shadow-md shadow-black/40 transition-[box-shadow,border-color,box-shadow] focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/25 focus-within:ring-2 focus-within:ring-primary/30"
      >
        {/* Barra superior: región | buscar + limpiar | enviar */}
        <div className="flex flex-col sm:flex-row sm:items-stretch" role="search">
          <div className="flex shrink-0 flex-col justify-center border-border bg-primary/10 px-4 py-3 sm:w-[min(11rem,34%)] sm:border-e">
            <span id="search-region-label" className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Región
            </span>
            <div className="relative mt-0.5">
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as RiotPlatformId)}
                className={`${fieldBase} min-h-10 !min-w-0 cursor-pointer appearance-none pe-7 font-medium`}
                aria-labelledby="search-region-label"
              >
                {RIOT_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center bg-input/80 px-3 py-2 sm:py-2">
            <label htmlFor="riotId" className="text-xs font-semibold uppercase tracking-wide text-foreground/90">
              Buscar
            </label>
            <div className="flex items-center gap-1">
              <input
                id="riotId"
                type="text"
                autoComplete="off"
                placeholder="Ej. GRV Degryh o GRV Degryh#ESP"
                value={riotIdLine}
                role="combobox"
                aria-expanded={panelOpen}
                aria-controls="player-search-panel"
                className={fieldBase}
                onChange={(e) => {
                  const v = e.target.value;
                  setRiotIdLine(v);
                  setSideTab("search");
                  setHighlight(-1);
                  setPanelOpen(true);
                }}
                onFocus={() => {
                  setPanelOpen(true);
                  if (!riotIdLine.trim()) setSideTab("recent");
                  else setSideTab("search");
                }}
                onKeyDown={(e) => {
                  if (!panelOpen && e.key === "ArrowDown") {
                    setPanelOpen(true);
                    if (list.length > 0) {
                      setHighlight(0);
                      e.preventDefault();
                    }
                    return;
                  }
                  if (!panelOpen) return;

                  if (e.key === "Escape") {
                    setPanelOpen(false);
                    setHighlight(-1);
                    e.preventDefault();
                  } else if (list.length > 0 && e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlight((h) => Math.min(list.length - 1, h + 1));
                  } else if (list.length > 0 && e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlight((h) => Math.max(-1, h - 1));
                  } else if (e.key === "Enter" && highlight >= 0 && list[highlight]) {
                    e.preventDefault();
                    goToSummoner(list[highlight]);
                  }
                }}
              />
              {riotIdLine ? (
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-white/10"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setRiotIdLine("");
                    setHighlight(-1);
                    setSideTab("recent");
                  }}
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex border-t border-border sm:border-s sm:border-t-0">
            <button
              type="submit"
              className="flex min-h-12 w-full min-w-[7rem] items-center justify-center gap-2 bg-primary px-5 text-base font-semibold text-primary-foreground transition hover:bg-primary/92 active:bg-primary/85 sm:min-h-0 sm:px-6"
              aria-label="Buscar invocador"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
                <path
                  d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        {/* Panel tipo “FIND PLAYERS”: pestañas + lista */}
        {panelOpen ? (
          <div
            id="player-search-panel"
            className="flex max-h-[min(24rem,55vh)] flex-col border-t border-border md:max-h-[min(20rem,50vh)] md:flex-row"
          >
            <nav
              className="flex shrink-0 gap-0 border-border bg-muted/25 px-2 py-2 md:w-48 md:flex-col md:border-e md:border-b-0 md:py-3"
              aria-label="Origen de la lista"
            >
              <button
                type="button"
                onClick={() => {
                  setSideTab("search");
                  setHighlight(-1);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition md:py-2 ${
                  sideTab === "search"
                    ? "border-primary bg-accent text-foreground md:border-s-2 md:border-s-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                Resultados
              </button>
              <button
                type="button"
                onClick={() => {
                  setSideTab("recent");
                  setHighlight(-1);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition md:py-2 ${
                  sideTab === "recent"
                    ? "border-primary bg-accent text-foreground md:border-s-2 md:border-s-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 8v4l3 2M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                </svg>
                Recientes
              </button>
              <button
                type="button"
                onClick={() => {
                  setSideTab("favorites");
                  setHighlight(-1);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition md:py-2 ${
                  sideTab === "favorites"
                    ? "border-primary bg-accent text-foreground md:border-s-2 md:border-s-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path
                    d="M12 2l2.9 6.55L22 9.9l-5 4.35L18.18 22 12 18.9 5.82 22 7 14.25 2 9.9l7.1-1.35L12 2z"
                    strokeLinejoin="round"
                  />
                </svg>
                Favoritos
              </button>
            </nav>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Jugadores
              </p>
              {typeaheadFlags.banner && sideTab === "search" && list.length > 0 ? (
                <p
                  role="status"
                  className="border-b border-amber-500/25 bg-amber-950/25 px-3 py-2 text-xs text-amber-100/95"
                >
                  {typeaheadFlags.banner}
                </p>
              ) : null}
              <ul role="listbox" className="min-h-0 flex-1 overflow-y-auto">
                {list.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {sideTab === "search"
                      ? liveLookup === "loading"
                        ? "Buscando jugadores…"
                        : liveLookup === "notfound"
                          ? typeaheadFlags.hint ||
                            (parseSingleRiotId(riotIdLine)
                              ? "No existe ese Riot ID. Revisa nombre, etiqueta (#TAG) y la región."
                              : "Sin coincidencias: prueba el Riot ID completo (mismo nombre y mayúsculas que en el cliente + #TAG, ej. GRV Degryh#ESP) y región EUW.")
                          : liveLookup === "error"
                            ? typeaheadFlags.trnAuthError
                              ? "Tracker Network rechazó la clave (401). Regenera TRN_API_KEY (sin comillas), pulsa «Apply for Production» si aplica, y reinicia pnpm dev."
                              : typeaheadFlags.riotUpstream502
                                ? "La API de Riot devolvió error de autenticación (revisa RIOT_API_KEY)."
                                : "No se pudo consultar ahora (red o configuración). Inténtalo de nuevo."
                            : riotIdLine.trim().includes("#") && !parseSingleRiotId(riotIdLine)
                              ? "Completa el Riot ID: Nombre#TAG (solo letras y números en la etiqueta)."
                              : riotIdLine.trim().length > 0 &&
                                  riotIdLine.trim().length < 2 &&
                                  !riotIdLine.trim().includes("#")
                                ? "Escribe al menos 2 caracteres del nombre."
                                : "Escribe al menos 2 caracteres: nombre en la región o Riot ID con #TAG."
                      : sideTab === "recent"
                        ? "Aún no hay búsquedas recientes en este dispositivo."
                        : "No hay favoritos. Pulsa la estrella en un resultado."}
                  </li>
                ) : (
                  list.map((s, i) => {
                    const parts = splitRiotIdDisplay(s.riotIdLine);
                    const fav = isFavoriteSummoner(s.riotIdLine, s.platform);
                    const sourceBadge =
                      sideTab === "search" && s.suggestSource === "trn"
                        ? "Tracker"
                        : sideTab === "search" && s.suggestSource === "riot"
                          ? "Riot"
                          : null;
                    return (
                      <li key={`${s.riotIdLine}-${s.platform}-${i}`} role="none">
                        <div
                          role="option"
                          aria-selected={i === highlight}
                          className={`flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0 ${
                            i === highlight ? "bg-accent" : "hover:bg-muted/50"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              goToSummoner(s);
                            }}
                            onMouseEnter={() => setHighlight(i)}
                          >
                            {s.profileIconUrl ? (
                              <div className="size-9 shrink-0 overflow-hidden rounded-lg">
                                <ProfileIcon src={s.profileIconUrl} size={36} className="!h-9 !w-9 rounded-lg object-cover" />
                              </div>
                            ) : (
                              <Image
                                src="/LoL-Tracker.png"
                                alt=""
                                width={36}
                                height={36}
                                className="size-9 shrink-0 rounded-lg object-cover"
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {parts ? (
                                <>
                                  <span className="font-semibold text-foreground">{parts.gameName}</span>
                                  <span className="text-muted-foreground">
                                    #{parts.tag}
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    · {platformLabel(s.platform)}
                                    {sourceBadge ? (
                                      <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                        {sourceBadge}
                                      </span>
                                    ) : null}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-foreground">{s.riotIdLine}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">· {platformLabel(s.platform)}</span>
                                </>
                              )}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-primary"
                            aria-label={fav ? "Quitar favorito" : "Añadir favorito"}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              ev.stopPropagation();
                            }}
                            onClick={() => {
                              toggleFavoriteSummoner(s.riotIdLine, s.platform);
                              bumpFavorites((x) => x + 1);
                            }}
                          >
                            <StarIcon filled={fav} />
                          </button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        El <strong className="font-medium text-foreground/80">#TAG</strong> es la parte después de la almohadilla del{" "}
        <strong className="font-medium text-foreground/80">Riot ID</strong> (ej.{" "}
        <strong className="font-medium text-foreground/80">GRV Degryh#ESP</strong>
        : nombre + <strong className="font-medium text-foreground/80">#ESP</strong>). Puedes escribir el{" "}
        <strong className="font-medium text-foreground/80">nombre exacto</strong> en la región elegida (igual que en el
        cliente) o el Riot ID completo. Prefijos tipo «grv» sin Tracker Network no los resuelve la API de Riot.
      </p>

      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
