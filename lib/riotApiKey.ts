/**
 * Clave de la API de Riot: solo variable de entorno en servidor (Producción / políticas Riot).
 * Configura RIOT_API_KEY en .env.local o en el proveedor de hosting.
 */
export function getRiotApiKey(): string | undefined {
  const env = process.env.RIOT_API_KEY?.trim();
  return env || undefined;
}
