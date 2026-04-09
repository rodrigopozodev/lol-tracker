import type { RiotPlatformId } from "@/lib/riot/platforms";
import { isRiotPlatform } from "@/lib/riot/platforms";

const ALIAS: Record<string, RiotPlatformId> = {
  euw: "euw1",
  euw1: "euw1",
  eune: "eun1",
  eun1: "eun1",
  na: "na1",
  na1: "na1",
  br: "br1",
  br1: "br1",
  lan: "la1",
  la1: "la1",
  las: "la2",
  la2: "la2",
  jp: "jp1",
  jp1: "jp1",
  kr: "kr",
  oce: "oc1",
  oc1: "oc1",
  ru: "ru",
  tr: "tr1",
  tr1: "tr1",
};

/** Normaliza cadenas tipo "EUW", "euw1" desde metadatos TRN. */
export function trnRegionToPlatform(region: string | null | undefined): RiotPlatformId | null {
  if (!region || typeof region !== "string") return null;
  const k = region.trim().toLowerCase().replace(/\s+/g, "");
  if (isRiotPlatform(k)) return k;
  const mapped = ALIAS[k];
  return mapped ?? null;
}
