/**
 * Historial local (localStorage) para autocomplete de Riot ID.
 * La API Riot no expone búsqueda difusa global; las sugerencias vienen de
 * búsquedas anteriores en este dispositivo y perfiles cargados con éxito.
 */

import type { RiotPlatformId } from "@/lib/riot/platforms";

const STORAGE_KEY = "lol-tracker-recent-summoners";
const FAVORITES_KEY = "lol-tracker-favorite-summoners";
const TYPEAHEAD_CACHE_KEY = "lol-tracker-typeahead-cache";
const MAX_STORED = 40;
const TYPEAHEAD_CACHE_MAX = 120;

/** Entradas de «Recientes» más viejas se eliminan (lectura y guardado). */
export const RECENT_SUMMONERS_TTL_MS = 60 * 60 * 1000;

/** Tras una resolución correcta, no volver a llamar al API hasta pasado este tiempo (ms). */
export const TYPEAHEAD_CACHE_FRESH_MS = 10 * 60 * 1000;

type TypeaheadCacheRow = {
  riotIdLine: string;
  platform: RiotPlatformId;
  profileIconUrl?: string | null;
  suggestSource?: "trn" | "riot";
  lastOkAt: number;
};

export type RecentSummonerEntry = {
  riotIdLine: string;
  platform: RiotPlatformId;
  ts: number;
};

export type SummonerSuggestion = {
  riotIdLine: string;
  platform: RiotPlatformId;
  /** Avatar en resultados de búsqueda (p. ej. Tracker Network). */
  profileIconUrl?: string | null;
  /** Origen del typeahead para la UI. */
  suggestSource?: "trn" | "riot";
};

export type FavoriteSummoner = {
  riotIdLine: string;
  platform: RiotPlatformId;
};

function riotIdKey(line: string): string {
  const t = line.trim();
  const i = t.indexOf("#");
  if (i <= 0) return t.toLowerCase();
  return `${t.slice(0, i).trim().toLowerCase()}#${t.slice(i + 1).trim().toLowerCase()}`;
}

function favoriteKey(line: string, platform: RiotPlatformId): string {
  return `${riotIdKey(line)}|${platform}`;
}

function typeaheadCacheStorageKey(platform: RiotPlatformId, riotIdLine: string): string {
  return `${platform}|${riotIdKey(riotIdLine)}`;
}

function loadTypeaheadCacheRows(): TypeaheadCacheRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TYPEAHEAD_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is TypeaheadCacheRow =>
        x !== null &&
        typeof x === "object" &&
        typeof (x as TypeaheadCacheRow).riotIdLine === "string" &&
        typeof (x as TypeaheadCacheRow).platform === "string" &&
        typeof (x as TypeaheadCacheRow).lastOkAt === "number"
    );
  } catch {
    return [];
  }
}

function saveTypeaheadCacheRows(rows: TypeaheadCacheRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TYPEAHEAD_CACHE_KEY, JSON.stringify(rows));
  } catch {
    /* cuota / privado */
  }
}

function rowToSuggestion(row: TypeaheadCacheRow): SummonerSuggestion {
  return {
    riotIdLine: row.riotIdLine,
    platform: row.platform,
    profileIconUrl: row.profileIconUrl,
    suggestSource: row.suggestSource,
  };
}

/** Guarda avatar/origen del typeahead para reutilizar sin esperar a Riot/TRN. */
export function rememberTypeaheadResults(results: SummonerSuggestion[]): void {
  if (typeof window === "undefined" || results.length === 0) return;
  const now = Date.now();
  const byKey = new Map<string, TypeaheadCacheRow>();
  for (const row of loadTypeaheadCacheRows()) {
    byKey.set(typeaheadCacheStorageKey(row.platform, row.riotIdLine), row);
  }
  for (const s of results) {
    const line = s.riotIdLine.trim();
    if (!line.includes("#")) continue;
    const k = typeaheadCacheStorageKey(s.platform, line);
    byKey.set(k, {
      riotIdLine: line,
      platform: s.platform,
      profileIconUrl: s.profileIconUrl,
      suggestSource: s.suggestSource,
      lastOkAt: now,
    });
  }
  const next = [...byKey.values()].sort((a, b) => b.lastOkAt - a.lastOkAt).slice(0, TYPEAHEAD_CACHE_MAX);
  saveTypeaheadCacheRows(next);
}

function findTypeaheadCacheRow(platform: RiotPlatformId, riotIdLine: string): TypeaheadCacheRow | null {
  if (typeof window === "undefined") return null;
  const want = typeaheadCacheStorageKey(platform, riotIdLine);
  for (const row of loadTypeaheadCacheRows()) {
    if (typeaheadCacheStorageKey(row.platform, row.riotIdLine) === want) return row;
  }
  return null;
}

export function getTypeaheadCacheHit(
  platform: RiotPlatformId,
  riotIdLine: string
): { suggestion: SummonerSuggestion; lastOkAt: number } | null {
  const row = findTypeaheadCacheRow(platform, riotIdLine);
  if (!row) return null;
  return { suggestion: rowToSuggestion(row), lastOkAt: row.lastOkAt };
}

/** Añade icono y badge guardados a sugerencias de recientes/favoritos/autocomplete local. */
export function enrichSuggestionWithTypeaheadCache(s: SummonerSuggestion): SummonerSuggestion {
  const row = findTypeaheadCacheRow(s.platform, s.riotIdLine);
  if (!row) return s;
  return {
    ...s,
    profileIconUrl: s.profileIconUrl ?? row.profileIconUrl,
    suggestSource: s.suggestSource ?? row.suggestSource,
  };
}

export function summonerSuggestionDedupeKey(s: SummonerSuggestion): string {
  return `${s.platform}|${riotIdKey(s.riotIdLine)}`;
}

/**
 * Sugerencias inmediatas (sin esperar al API) desde caché de typeahead + historial reciente.
 * Orden: coincidencias en caché primero, luego recientes; deduplicado por región + Riot ID.
 */
export function instantTypeaheadSuggestions(
  query: string,
  platform: RiotPlatformId,
  limit = 12
): SummonerSuggestion[] {
  const fromCache = suggestFromTypeaheadCache(query, platform, limit);
  const fromRecent = suggestSummoners(query, limit);
  const seen = new Set<string>();
  const out: SummonerSuggestion[] = [];
  const push = (s: SummonerSuggestion) => {
    const k = summonerSuggestionDedupeKey(s);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(s);
  };
  for (const s of fromCache) {
    push(s);
    if (out.length >= limit) return out;
  }
  for (const s of fromRecent) {
    push(s);
    if (out.length >= limit) return out;
  }
  return out;
}

function suggestFromTypeaheadCache(query: string, platform: RiotPlatformId, limit = 8): SummonerSuggestion[] {
  const qRaw = query.trim();
  const q = qRaw.toLowerCase();
  if (q.length < 1) return [];

  const rows = loadTypeaheadCacheRows().filter((r) => r.platform === platform);
  type Scored = { row: TypeaheadCacheRow; score: number };
  const scored: Scored[] = [];

  for (const row of rows) {
    const full = row.riotIdLine.toLowerCase();
    const gn = gameNameFromLine(row.riotIdLine).toLowerCase();
    const tag = tagFromLine(row.riotIdLine).toLowerCase();
    let score = 0;

    if (!qRaw.includes("#")) {
      if (gn === q) score = 100_000;
      else if (gn.startsWith(q)) score = 50_000 + Math.max(0, 500 - gn.length);
      else if (gn.includes(q)) score = 30_000;
      else if (full.includes(q)) score = 25_000;
      else if (tag.includes(q) && q.length >= 2) score = 12_000;
      else if (q.length >= 2) {
        const d = levenshtein(gn, q);
        const maxDist = Math.max(1, Math.min(4, Math.floor(q.length / 2) + 1));
        if (d <= maxDist && gn.length <= 32) {
          score = 8000 - d * 400 - Math.abs(gn.length - q.length) * 10;
        }
      }
    } else {
      const qNorm = qRaw.replace(/\s*#\s*/g, "#").trim().toLowerCase();
      const fullNorm = row.riotIdLine.replace(/\s*#\s*/g, "#").trim().toLowerCase();
      if (fullNorm === qNorm) score = 100_000;
      else if (fullNorm.replace(/\s/g, "").includes(qNorm.replace(/\s/g, ""))) score = 40_000;
      else {
        const qName = qNorm.split("#")[0]?.trim() ?? "";
        if (qName && fullNorm.startsWith(qName)) score = 20_000;
      }
    }

    if (score > 0) scored.push({ row, score });
  }

  scored.sort((a, b) => b.score - a.score || b.row.lastOkAt - a.row.lastOkAt);
  return scored.slice(0, limit).map((s) => rowToSuggestion(s.row));
}

/** Nombre y etiqueta para mostrar (misma línea visual que en el cliente). */
export function splitRiotIdDisplay(line: string): { gameName: string; tag: string } | null {
  const t = line.trim();
  const i = t.indexOf("#");
  if (i <= 0) return null;
  const gameName = t.slice(0, i).trim();
  const tag = t.slice(i + 1).trim();
  if (!gameName || !tag) return null;
  return { gameName, tag };
}

export function loadFavoriteSummoners(): FavoriteSummoner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FavoriteSummoner =>
        x !== null &&
        typeof x === "object" &&
        typeof (x as FavoriteSummoner).riotIdLine === "string" &&
        typeof (x as FavoriteSummoner).platform === "string"
    );
  } catch {
    return [];
  }
}

export function isFavoriteSummoner(riotIdLine: string, platform: RiotPlatformId): boolean {
  return loadFavoriteSummoners().some(
    (f) => favoriteKey(f.riotIdLine, f.platform) === favoriteKey(riotIdLine, platform)
  );
}

export function toggleFavoriteSummoner(riotIdLine: string, platform: RiotPlatformId): boolean {
  if (typeof window === "undefined") return false;
  const line = riotIdLine.trim();
  if (!line.includes("#")) return false;
  const fk = favoriteKey(line, platform);
  const prev = loadFavoriteSummoners();
  const exists = prev.some((f) => favoriteKey(f.riotIdLine, f.platform) === fk);
  const next = exists
    ? prev.filter((f) => favoriteKey(f.riotIdLine, f.platform) !== fk)
    : [...prev, { riotIdLine: line, platform }];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    return exists;
  }
  return !exists;
}

export function favoritesAsSuggestions(limit = 20): SummonerSuggestion[] {
  return loadFavoriteSummoners()
    .slice(0, limit)
    .map((f) => enrichSuggestionWithTypeaheadCache({ riotIdLine: f.riotIdLine, platform: f.platform }));
}

/** Recientes como sugerencias (más nuevos primero). */
export function recentAsSuggestions(limit = 15): SummonerSuggestion[] {
  return loadRecentSummoners()
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .slice(0, limit)
    .map((e) => enrichSuggestionWithTypeaheadCache({ riotIdLine: e.riotIdLine, platform: e.platform }));
}

function pruneRecentByTtl(entries: RecentSummonerEntry[]): RecentSummonerEntry[] {
  const cutoff = Date.now() - RECENT_SUMMONERS_TTL_MS;
  return entries.filter((e) => e.ts >= cutoff);
}

export function loadRecentSummoners(): RecentSummonerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (x): x is RecentSummonerEntry =>
        x !== null &&
        typeof x === "object" &&
        typeof (x as RecentSummonerEntry).riotIdLine === "string" &&
        typeof (x as RecentSummonerEntry).platform === "string" &&
        typeof (x as RecentSummonerEntry).ts === "number"
    );
    const pruned = pruneRecentByTtl(valid);
    if (pruned.length !== valid.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      } catch {
        /* noop */
      }
    }
    return pruned;
  } catch {
    return [];
  }
}

export function addRecentSummonerSearch(riotIdLine: string, platform: RiotPlatformId): void {
  if (typeof window === "undefined") return;
  const line = riotIdLine.trim();
  if (!line.includes("#")) return;
  const prev = loadRecentSummoners();
  const next: RecentSummonerEntry[] = [
    { riotIdLine: line, platform, ts: Date.now() },
    ...prev.filter((e) => riotIdKey(e.riotIdLine) !== riotIdKey(line)),
  ].slice(0, MAX_STORED);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* cuota / privado */
  }
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, row[j] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

function gameNameFromLine(line: string): string {
  const i = line.indexOf("#");
  return i <= 0 ? line.trim() : line.slice(0, i).trim();
}

function tagFromLine(line: string): string {
  const i = line.indexOf("#");
  return i <= 0 ? "" : line.slice(i + 1).trim();
}

/** Hasta `limit` coincidencias más parecidas (comparación en minúsculas). */
export function suggestSummoners(query: string, limit = 8): SummonerSuggestion[] {
  const qRaw = query.trim();
  const q = qRaw.toLowerCase();
  if (q.length < 1) return [];

  const recent = loadRecentSummoners();
  const byKey = new Map<string, RecentSummonerEntry>();
  for (const e of [...recent].sort((a, b) => b.ts - a.ts)) {
    const k = riotIdKey(e.riotIdLine);
    if (!byKey.has(k)) byKey.set(k, e);
  }

  type Scored = { entry: RecentSummonerEntry; score: number };
  const scored: Scored[] = [];

  for (const entry of byKey.values()) {
    const full = entry.riotIdLine.toLowerCase();
    const gn = gameNameFromLine(entry.riotIdLine).toLowerCase();
    const tag = tagFromLine(entry.riotIdLine).toLowerCase();
    let score = 0;

    if (!qRaw.includes("#")) {
      if (gn === q) score = 100_000;
      else if (gn.startsWith(q)) score = 50_000 + Math.max(0, 500 - gn.length);
      else if (gn.includes(q)) score = 30_000;
      else if (full.includes(q)) score = 25_000;
      else if (tag.includes(q) && q.length >= 2) score = 12_000;
      else if (q.length >= 2) {
        const d = levenshtein(gn, q);
        const maxDist = Math.max(1, Math.min(4, Math.floor(q.length / 2) + 1));
        if (d <= maxDist && gn.length <= 32) {
          score = 8000 - d * 400 - Math.abs(gn.length - q.length) * 10;
        }
      }
    } else {
      const qNorm = qRaw.replace(/\s*#\s*/g, "#").trim().toLowerCase();
      const fullNorm = entry.riotIdLine.replace(/\s*#\s*/g, "#").trim().toLowerCase();
      if (fullNorm === qNorm) score = 100_000;
      else if (fullNorm.replace(/\s/g, "").includes(qNorm.replace(/\s/g, ""))) score = 40_000;
      else {
        const qName = qNorm.split("#")[0]?.trim() ?? "";
        if (qName && fullNorm.startsWith(qName)) score = 20_000;
      }
    }

    if (score > 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || b.entry.ts - a.entry.ts);
  return scored
    .slice(0, limit)
    .map((s) =>
      enrichSuggestionWithTypeaheadCache({
        riotIdLine: s.entry.riotIdLine,
        platform: s.entry.platform,
      })
    );
}
