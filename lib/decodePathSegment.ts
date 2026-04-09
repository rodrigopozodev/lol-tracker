/** Decodifica un segmento de ruta de forma segura (evita fallos si ya venía decodificado). */
export function safeDecodePathSegment(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
