import { NextResponse } from "next/server";
import { writeRiotApiKeyToFile } from "@/lib/riotApiKey";

export const dynamic = "force-dynamic";

/** Guardar con un solo campo en la UI: dev local, o VPS con RIOT_ALLOW_UNSAFE_KEY_UPDATE, o token opcional. */
function authorize(req: Request): boolean {
  if (process.env.RIOT_ALLOW_UNSAFE_KEY_UPDATE === "true") return true;
  if (process.env.NODE_ENV !== "production") return true;

  const token = req.headers.get("x-admin-token");
  const admin = process.env.ADMIN_WRITE_SECRET;
  const cron = process.env.CRON_SECRET;
  if (admin && token === admin) return true;
  if (cron && token === cron) return true;
  return false;
}

/** Guarda la clave en data/riot_api_key.txt. */
export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json(
      {
        error:
          "No autorizado. En producción añade RIOT_ALLOW_UNSAFE_KEY_UPDATE=true en el entorno (solo uso personal) o define ADMIN_WRITE_SECRET / CRON_SECRET y envía la cabecera X-Admin-Token.",
      },
      { status: 401 }
    );
  }
  let body: { apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const apiKey = typeof body.apiKey === "string" ? body.apiKey : "";
  try {
    writeRiotApiKeyToFile(apiKey);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
