/**
 * Parsea un Riot ID en una sola línea: "Nombre#TAG", "Nombre # TAG", con espacios opcionales
 * alrededor de # y espacios normalizados en el nombre de invocador.
 */
export function parseSingleRiotId(input: string): { gameName: string; tagLine: string } | null {
  const normalized = input.trim().replace(/\s+/g, " ");
  if (!normalized.includes("#")) return null;

  const m = normalized.match(/^(.+?)\s*#\s*([A-Za-z0-9]+)$/);
  if (!m) return null;

  const gameName = m[1].trim().replace(/\s+/g, " ");
  const tagLine = m[2].trim();
  if (!gameName || !tagLine) return null;

  return { gameName, tagLine };
}
