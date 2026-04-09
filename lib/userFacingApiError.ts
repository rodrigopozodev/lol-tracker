/**
 * Convierte respuestas fallidas de nuestras rutas /api/riot/* en mensajes claros para la UI.
 */

export type UserFacingApiError = {
  message: string;
  /** Si el usuario puede reintentar tras esperar */
  retryable: boolean;
};

const RATE_HINT =
  "Demasiadas peticiones a Riot en poco tiempo. Espera un minuto y vuelve a intentarlo.";

const TOKEN_HINT =
  "La clave de la API de Riot no es válida, ha caducado o no tiene permiso. Revisa RIOT_API_KEY en el servidor.";

const NOT_FOUND_HINT =
  "No se encontró ese invocador en esta región. Comprueba el Riot ID (Nombre#TAG) y la región.";

const SERVER_KEY_HINT =
  "El servidor no tiene configurada la clave de Riot (RIOT_API_KEY). Contacta al administrador.";

export function userFacingApiError(status: number, serverError?: string): UserFacingApiError {
  const err = (serverError ?? "").trim();
  const lower = err.toLowerCase();

  if (status === 500 && (lower.includes("riot_api_key") || lower.includes("no configurada"))) {
    return { message: SERVER_KEY_HINT, retryable: false };
  }

  if (
    status === 503 ||
    status === 429 ||
    lower.includes("429") ||
    lower.includes("límite de peticiones") ||
    lower.includes("rate limit")
  ) {
    return { message: err || RATE_HINT, retryable: true };
  }

  if (
    status === 502 ||
    status === 403 ||
    lower.includes("token inválido") ||
    lower.includes("token invalido") ||
    lower.includes("riot_token")
  ) {
    return { message: err || TOKEN_HINT, retryable: false };
  }

  if (status === 404) {
    if (lower.includes("cuenta no encontrada") || lower.includes("no encontrada")) {
      return { message: NOT_FOUND_HINT, retryable: false };
    }
    if (lower.includes("ranking") || lower.includes("partida")) {
      return { message: err || "No se encontró ese recurso.", retryable: false };
    }
    return { message: err || NOT_FOUND_HINT, retryable: false };
  }

  if (status === 400) {
    return {
      message: err || "Solicitud incorrecta. Revisa región, nombre y etiqueta.",
      retryable: false,
    };
  }

  return {
    message: err || "Ha ocurrido un error al contactar con el servicio. Inténtalo de nuevo más tarde.",
    retryable: status >= 500,
  };
}

/** Lee el cuerpo JSON tras un `fetch` fallido (no consumir `res` dos veces antes). */
export async function parseErrorBody(res: Response): Promise<{ error?: string }> {
  try {
    const text = await res.text();
    if (!text) return {};
    const j = JSON.parse(text) as { error?: string };
    return typeof j?.error === "string" ? { error: j.error } : {};
  } catch {
    return {};
  }
}
