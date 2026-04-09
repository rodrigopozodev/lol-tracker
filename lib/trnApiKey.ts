/**
 * Tracker Network (tracker.gg) – clave opcional para búsqueda por prefijo (typeahead).
 * Crea una app en https://tracker.gg/developers – el acceso a ciertos juegos puede requerir whitelist.
 */
export function getTrnApiKey(): string | undefined {
  const env =
    process.env.TRN_API_KEY?.trim() ||
    process.env.TRACKER_NETWORK_API_KEY?.trim() ||
    process.env.TRACKER_GG_API_KEY?.trim();
  return env || undefined;
}
