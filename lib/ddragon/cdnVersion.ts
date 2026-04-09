/** Versión por si falla la API de versiones (debe ser reciente para iconos nuevos). */
export const DDRAGON_VERSION_FALLBACK = "16.7.1";

let memory: { version: string; at: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

/**
 * Primera entrada de https://ddragon.leagueoflegends.com/api/versions.json (servidor).
 * Cache en memoria ~1 h para no golpear DD en cada typeahead.
 */
export async function getDdragonCdnVersion(): Promise<string> {
  const now = Date.now();
  if (memory && now - memory.at < TTL_MS) return memory.version;

  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as unknown;
    const v =
      Array.isArray(data) && data.length > 0 && typeof data[0] === "string"
        ? data[0]
        : DDRAGON_VERSION_FALLBACK;
    memory = { version: v, at: now };
    return v;
  } catch {
    return memory?.version ?? DDRAGON_VERSION_FALLBACK;
  }
}

export async function ddragonProfileIconUrl(profileIconId: number | null): Promise<string | null> {
  if (profileIconId == null) return null;
  const v = await getDdragonCdnVersion();
  return `https://ddragon.leagueoflegends.com/cdn/${v}/img/profileicon/${profileIconId}.png`;
}
