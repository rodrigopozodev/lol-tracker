/** Convierte plataforma (euw1, na1…) al host regional de match-v5 / routing. */

export type RegionalCluster = "americas" | "europe" | "asia";

export function platformToRegionalCluster(platform: string): RegionalCluster {
  const p = platform.toLowerCase();
  if (["na1", "br1", "la1", "la2", "oc1"].includes(p)) return "americas";
  if (["euw1", "eun1", "tr1", "ru"].includes(p)) return "europe";
  if (["kr", "jp1"].includes(p)) return "asia";
  return "europe";
}

export function regionalClusterHost(cluster: RegionalCluster): string {
  return `${cluster}.api.riotgames.com`;
}
