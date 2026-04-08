/**
 * Fecha/hora estable entre SSR (Node) y el navegador para evitar React #418 por texto distinto.
 * Sin `timeZone` fija, el servidor y el cliente pueden formatear distinto (zona del proceso vs usuario).
 */
const DISPLAY_TZ = process.env.NEXT_PUBLIC_HOME_DISPLAY_TZ || "Europe/Madrid";

export function formatEsDateTime(ms: number): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DISPLAY_TZ,
  }).format(new Date(ms));
}
