/**
 * URLs de assets de League (Data Dragon), mismo criterio que gravelinas-sport:
 * - Versiones: https://ddragon.leagueoflegends.com/api/versions.json
 * - Campeón: cdn/{v}/img/champion/{Key}.png
 * - Objeto: cdn/{v}/img/item/{id}.png
 * - Hechizo: cdn/{v}/img/spell/{SummonerX}.png
 * - Runas: cdn/img/{perk-images/...} (sin versión en el path)
 */

let versionMemo: string | null = null;

export async function getLatestDdragonVersion(): Promise<string> {
  if (versionMemo) return versionMemo;
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
      next: { revalidate: 3600 },
    });
    const arr = (await res.json()) as string[];
    versionMemo = Array.isArray(arr) && arr[0] ? arr[0] : "15.1.1";
  } catch {
    versionMemo = "15.1.1";
  }
  return versionMemo;
}

export function profileIconUrl(version: string, profileIconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`;
}

export function championSquareUrl(version: string, championKey: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championKey}.png`;
}

export function itemIconUrl(version: string, itemId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

export function spellIconUrl(version: string, summonerKey: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${summonerKey}.png`;
}

/** Habilidad del campeón: ej. Briar + "Q" → BriarQ.png */
export function championAbilityIconUrl(
  version: string,
  championKey: string,
  slot: "Q" | "W" | "E" | "R",
): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${championKey}${slot}.png`;
}

/** Path relativo bajo cdn/img/ — ej. perk-images/Styles/Domination/Electrocute/Electrocute.png */
export function runeIconUrl(perkPath: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/${perkPath}`;
}
