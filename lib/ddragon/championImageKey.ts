import { getDdragonCdnVersion } from "@/lib/ddragon/cdnVersion";

type Maps = {
  byNumericId: Map<string, string>;
  byNormalized: Map<string, string>;
};

let cached: { version: string; maps: Maps; at: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

/** Para empatar nombres de Riot / DD (espacios, tildes, etc.). */
export function normalizeChampionToken(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/gu, "");
}

async function loadMapsForVersion(version: string): Promise<Maps> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`champion.json ${res.status}`);
  const json = (await res.json()) as {
    data?: Record<string, { key: string; name: string; id: string }>;
  };
  const data = json?.data ?? {};
  const byNumericId = new Map<string, string>();
  const byNormalized = new Map<string, string>();

  for (const objectKey of Object.keys(data)) {
    const c = data[objectKey];
    if (!c?.key || !c.id) continue;
    const id = c.id;
    byNumericId.set(String(c.key), id);
    byNormalized.set(normalizeChampionToken(c.name), id);
    byNormalized.set(normalizeChampionToken(c.id), id);
    byNormalized.set(normalizeChampionToken(objectKey), id);
  }

  byNormalized.set("monkeyking", "MonkeyKing");
  byNormalized.set("wukong", "MonkeyKing");

  return { byNumericId, byNormalized };
}

export async function getChampionImageMaps(): Promise<Maps> {
  const version = await getDdragonCdnVersion();
  const now = Date.now();
  if (cached && cached.version === version && now - cached.at < TTL_MS) {
    return cached.maps;
  }
  const maps = await loadMapsForVersion(version);
  cached = { version, maps, at: now };
  return maps;
}

export function resolveChampionImageKey(
  maps: Maps,
  input: { championId?: number | null; championName?: string | null }
): string | null {
  if (input.championId != null && Number.isFinite(input.championId)) {
    const id = maps.byNumericId.get(String(Math.floor(input.championId)));
    if (id) return id;
  }
  const raw = input.championName?.trim();
  if (raw) {
    const n = normalizeChampionToken(raw);
    const id = maps.byNormalized.get(n);
    if (id) return id;
    if (!/\s/.test(raw) && /^[A-Za-z][A-Za-z0-9]*$/.test(raw)) return raw;
  }
  return null;
}

export async function enrichRowsChampionImageKeys<
  T extends {
    champion: string | null;
    championId?: number | null;
    championImageKey?: string | null;
  },
>(rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  const maps = await getChampionImageMaps();
  for (const row of rows) {
    const key = resolveChampionImageKey(maps, {
      championId: row.championId ?? null,
      championName: row.champion,
    });
    row.championImageKey = key ?? row.champion;
  }
}

/** Añade `championImageKey` a cada participante del JSON match-v5 (respuesta Riot). */
export async function enrichMatchV5ParticipantsJson(json: unknown): Promise<void> {
  const parts = (json as { info?: { participants?: unknown[] } })?.info?.participants;
  if (!Array.isArray(parts)) return;
  const maps = await getChampionImageMaps();
  for (const p of parts) {
    if (!p || typeof p !== "object") continue;
    const o = p as {
      championId?: number;
      championName?: string;
      championImageKey?: string;
    };
    const key = resolveChampionImageKey(maps, {
      championId: typeof o.championId === "number" ? o.championId : null,
      championName: typeof o.championName === "string" ? o.championName : null,
    });
    if (key) o.championImageKey = key;
  }
}
