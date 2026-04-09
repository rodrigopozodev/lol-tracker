import type { SummonerSuggestion } from "@/lib/summonerSearchHistory";
import { getTrnApiKey } from "@/lib/trnApiKey";
import type { RiotPlatformId } from "@/lib/riot/platforms";
import { isRiotPlatform } from "@/lib/riot/platforms";
import { trnRegionToPlatform } from "@/lib/trn/trnRegionToPlatform";

const TRN_SEARCH_URL = "https://public-api.tracker.gg/lol/v1/search";

function splitRiotIdLine(line: string): { gameName: string; tagLine: string } | null {
  const t = line.trim();
  const i = t.lastIndexOf("#");
  if (i <= 0) return null;
  const gameName = t.slice(0, i).trim();
  const tagLine = t.slice(i + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

function avatarFromUserInfo(u: Record<string, unknown>): string | null {
  for (const k of ["avatarUrl", "customAvatarUrl", "imageUrl", "avatar"]) {
    const v = u[k];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

function regionFromItem(item: Record<string, unknown>): RiotPlatformId | null {
  const tryKeys = [
    item.region,
    item.shardId,
    item.platformId,
    (item.metadata as Record<string, unknown> | undefined)?.shardId,
    (item.metadata as Record<string, unknown> | undefined)?.platformId,
    (item.attributes as Record<string, unknown> | undefined)?.shardId,
    (item.attributes as Record<string, unknown> | undefined)?.region,
  ];
  for (const v of tryKeys) {
    if (typeof v === "string") {
      const p = trnRegionToPlatform(v);
      if (p) return p;
    }
  }
  const pi = item.platformInfo;
  if (pi && typeof pi === "object") {
    const piu = (pi as Record<string, unknown>).platformId;
    if (typeof piu === "string") {
      const p = trnRegionToPlatform(piu);
      if (p) return p;
    }
  }
  return null;
}

function suggestionFromIdentifier(
  ident: string,
  item: Record<string, unknown>,
  fallbackPlatform: RiotPlatformId
): SummonerSuggestion | null {
  const parts = splitRiotIdLine(ident.replace(/\s*#\s*/g, "#"));
  if (!parts) return null;
  const plat = regionFromItem(item) ?? fallbackPlatform;
  if (!isRiotPlatform(plat)) return null;

  let profileIconUrl: string | null = null;
  const ui = item.userInfo;
  if (ui && typeof ui === "object") {
    profileIconUrl = avatarFromUserInfo(ui as Record<string, unknown>);
  }

  return {
    riotIdLine: `${parts.gameName}#${parts.tagLine}`,
    platform: plat,
    profileIconUrl,
    suggestSource: "trn",
  };
}

function collectFromObject(item: Record<string, unknown>, fallbackPlatform: RiotPlatformId, out: SummonerSuggestion[]) {
  const pi = item.platformInfo;
  if (pi && typeof pi === "object") {
    const id = (pi as { platformUserIdentifier?: unknown }).platformUserIdentifier;
    if (typeof id === "string") {
      const s = suggestionFromIdentifier(id, item, fallbackPlatform);
      if (s) out.push(s);
    }
  }
  const topId = item.platformUserIdentifier;
  if (typeof topId === "string") {
    const s = suggestionFromIdentifier(topId, item, fallbackPlatform);
    if (s) out.push(s);
  }
  const gn = item.gameName ?? item.displayName;
  const tl = item.tagLine ?? item.tagline;
  if (typeof gn === "string" && typeof tl === "string") {
    const s = suggestionFromIdentifier(`${gn}#${tl}`, item, fallbackPlatform);
    if (s) out.push(s);
  }
}

function dataArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.results)) return o.results;
    if (Array.isArray(o.suggestions)) {
      return o.suggestions.map((x) => (typeof x === "string" ? { raw: x } : x));
    }
  }
  return [];
}

/**
 * Interpreta la respuesta de búsqueda LoL de Tracker Network (formato puede variar).
 */
function walkTrnNodes(
  node: unknown,
  depth: number,
  fallbackPlatform: RiotPlatformId,
  out: SummonerSuggestion[]
): void {
  if (depth > 12 || node == null) return;
  if (Array.isArray(node)) {
    for (const x of node) walkTrnNodes(x, depth + 1, fallbackPlatform, out);
    return;
  }
  if (typeof node !== "object") return;
  collectFromObject(node as Record<string, unknown>, fallbackPlatform, out);
  for (const v of Object.values(node)) walkTrnNodes(v, depth + 1, fallbackPlatform, out);
}

function dedupeSuggestions(out: SummonerSuggestion[]): SummonerSuggestion[] {
  const seen = new Set<string>();
  const deduped: SummonerSuggestion[] = [];
  for (const s of out) {
    const k = `${s.riotIdLine.toLowerCase()}|${s.platform}`;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(s);
    if (deduped.length >= 30) break;
  }
  return deduped;
}

/**
 * Interpreta la respuesta de búsqueda LoL de Tracker Network (formato puede variar).
 */
export function normalizeTrnLolSearchPayload(
  json: unknown,
  fallbackPlatform: RiotPlatformId
): SummonerSuggestion[] {
  const out: SummonerSuggestion[] = [];
  const arr = dataArray(json);
  for (const el of arr) {
    if (typeof el === "string") {
      const s = suggestionFromIdentifier(el, {}, fallbackPlatform);
      if (s) out.push(s);
      continue;
    }
    if (!el || typeof el !== "object") continue;
    const item = el as Record<string, unknown>;
    if (typeof item.raw === "string") {
      const s = suggestionFromIdentifier(item.raw, item, fallbackPlatform);
      if (s) out.push(s);
    }
    collectFromObject(item, fallbackPlatform, out);
  }

  let deduped = dedupeSuggestions(out);
  if (deduped.length === 0 && json && typeof json === "object") {
    const deep: SummonerSuggestion[] = [];
    walkTrnNodes(json, 0, fallbackPlatform, deep);
    deduped = dedupeSuggestions(deep);
  }
  return deduped;
}

export async function searchTrnLolPlayers(
  query: string,
  fallbackPlatform: RiotPlatformId
): Promise<{ suggestions: SummonerSuggestion[]; httpStatus: number }> {
  const key = getTrnApiKey();
  const q = query.trim();
  if (!key || q.length < 2) {
    return { suggestions: [], httpStatus: 0 };
  }

  const url = `${TRN_SEARCH_URL}/${encodeURIComponent(q)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json", "TRN-Api-Key": key },
      cache: "no-store",
    });
  } catch {
    return { suggestions: [], httpStatus: 0 };
  }

  if (!res.ok) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[trn] lol search HTTP", res.status, url);
    }
    return { suggestions: [], httpStatus: res.status };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { suggestions: [], httpStatus: res.status };
  }

  const suggestions = normalizeTrnLolSearchPayload(json, fallbackPlatform);
  if (process.env.NODE_ENV === "development" && suggestions.length === 0) {
    const keys = json && typeof json === "object" ? Object.keys(json as object).join(",") : typeof json;
    console.warn("[trn] lol search 200 but 0 suggestions; top-level keys:", keys);
  }
  return { suggestions, httpStatus: res.status };
}
