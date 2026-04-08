import { CLUSTERS } from "@/lib/riot/multiSearchCore";
import { parseSingleRiotId } from "@/lib/parseRiotId";

export type ParsedSearchInput = {
  region: string | null;
  players: { gameName: string; tagLine: string }[];
};

/** Map OP.GG path segment (euw, na, kr) to Riot cluster id */
const OPGG_REGION_TO_CLUSTER: Record<string, string> = {
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

/**
 * Parse a single blob: OP.GG multisearch URL and/or lines of GameName#TAG.
 */
export function parseOpggInput(raw: string): ParsedSearchInput {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { region: null, players: [] };
  }

  let region: string | null = null;
  let rest = trimmed;

  const urlMatch = trimmed.match(
    /https?:\/\/(?:www\.)?op\.gg\/[^/]*\/lol\/multisearch\/([a-z]+)(?:\?|$)/i
  );
  if (urlMatch) {
    const seg = urlMatch[1].toLowerCase();
    region = OPGG_REGION_TO_CLUSTER[seg] ?? (CLUSTERS.includes(seg) ? seg : null);
    try {
      const u = new URL(trimmed.split(/\s/)[0]);
      const summoners = u.searchParams.get("summoners");
      if (summoners) {
        rest = decodeURIComponent(summoners.replace(/\+/g, " "));
      }
    } catch {
      /* use full text for player parsing */
    }
  }

  const players = parseSummonersList(rest);
  return { region, players };
}

function parseSummonersList(text: string): { gameName: string; tagLine: string }[] {
  const items = text
    .split(/[,\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const players: { gameName: string; tagLine: string }[] = [];
  for (const item of items) {
    const decoded = item.includes("%") ? decodeURIComponent(item) : item;
    const p = parseSingleRiotId(decoded);
    if (p) players.push(p);
  }
  return players;
}
