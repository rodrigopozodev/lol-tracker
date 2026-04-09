/** Plataformas de enrutamiento League (cluster). Misma lista que la API de Riot. */

export const RIOT_PLATFORMS = [
  { id: "euw1", label: "EUW" },
  { id: "eun1", label: "EUNE" },
  { id: "na1", label: "NA" },
  { id: "kr", label: "KR" },
  { id: "br1", label: "BR" },
  { id: "la1", label: "LAN" },
  { id: "la2", label: "LAS" },
  { id: "jp1", label: "JP" },
  { id: "oc1", label: "OCE" },
  { id: "ru", label: "RU" },
  { id: "tr1", label: "TR" },
] as const;

export type RiotPlatformId = (typeof RIOT_PLATFORMS)[number]["id"];

export function isRiotPlatform(id: string): id is RiotPlatformId {
  return RIOT_PLATFORMS.some((p) => p.id === id);
}

/**
 * Etiqueta Riot ID muy usada en cada shard (no siempre coincide con la cuenta real).
 * Sirve como primer intento cuando el usuario escribe solo el nombre, sin #.
 */
const DEFAULT_RIOT_TAGLINE: Record<RiotPlatformId, string> = {
  euw1: "EUW",
  eun1: "EUNE",
  na1: "NA",
  kr: "KR",
  br1: "BR",
  la1: "LAN",
  la2: "LAS",
  jp1: "JP",
  oc1: "OCE",
  ru: "RU",
  tr1: "TR",
};

export function defaultRiotTaglineForPlatform(platform: RiotPlatformId): string {
  return DEFAULT_RIOT_TAGLINE[platform];
}
