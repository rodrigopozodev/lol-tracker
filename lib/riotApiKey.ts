import fs from "fs";
import path from "path";

const FILE_NAME = "riot_api_key.txt";
const SAVED_AT_FILE = "riot_api_key_saved_at.txt";

function getDataDir(): string {
  const sqlitePath = process.env.SQLITE_PATH;
  if (sqlitePath) {
    return path.dirname(path.resolve(sqlitePath));
  }
  return path.join(process.cwd(), "data");
}

export function getRiotApiKeyFilePath(): string {
  return path.join(getDataDir(), FILE_NAME);
}

function getSavedAtFilePath(): string {
  return path.join(getDataDir(), SAVED_AT_FILE);
}

/** true si la clave activa viene de RIOT_API_KEY (tiene prioridad sobre el fichero). */
export function usesRiotApiKeyFromEnv(): boolean {
  return Boolean(process.env.RIOT_API_KEY?.trim());
}

/**
 * Epoch ms del último guardado exitoso desde la web (o mtime del fichero de clave si no hay meta).
 * null si no hay clave en fichero o no se puede leer.
 */
export function getRiotApiKeySavedAtMs(): number | null {
  try {
    const meta = getSavedAtFilePath();
    if (fs.existsSync(meta)) {
      const n = parseInt(fs.readFileSync(meta, "utf8").trim(), 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    const kp = getRiotApiKeyFilePath();
    if (fs.existsSync(kp)) {
      const k = fs.readFileSync(kp, "utf8").trim();
      if (k) return fs.statSync(kp).mtimeMs;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Prioridad: variable de entorno RIOT_API_KEY; si no hay, fichero en disco (guardado desde la web).
 */
export function getRiotApiKey(): string | undefined {
  const env = process.env.RIOT_API_KEY?.trim();
  if (env) return env;
  try {
    const p = getRiotApiKeyFilePath();
    if (fs.existsSync(p)) {
      const k = fs.readFileSync(p, "utf8").trim();
      if (k) return k;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

export function writeRiotApiKeyToFile(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed.startsWith("RGAPI-") || trimmed.length < 20) {
    throw new Error("Formato de clave inválido");
  }
  const dir = getDataDir();
  fs.mkdirSync(dir, { recursive: true });
  const now = Date.now();
  fs.writeFileSync(getRiotApiKeyFilePath(), trimmed, { encoding: "utf8" });
  fs.writeFileSync(getSavedAtFilePath(), String(now), { encoding: "utf8" });
}
