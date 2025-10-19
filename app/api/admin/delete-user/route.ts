import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ENV } from "@/config/env";
import path from "path";
import fs from "fs/promises";

async function removeTmpPhoneCode(email: string) {
  try {
    const tmpPath = path.resolve(process.cwd(), "tmp", "phone-codes.json");
    const buf = await fs.readFile(tmpPath, "utf8");
    const map = JSON.parse(buf || "{}");
    if (map[email]) {
      delete map[email];
      await fs.writeFile(tmpPath, JSON.stringify(map, null, 2), "utf8");
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

async function tryDelete(table: string, filter: Record<string, any>) {
  if (!supabaseAdmin) return { ok: false, error: "No admin client" };
  try {
    const q = supabaseAdmin.from(table).delete().match(filter);
    const { error } = await q;
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin no configurado" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const email: string | undefined = body?.email;
    const user_id: string | undefined = body?.user_id;

    // Resolver usuario por email si es necesario
    let targetId = user_id ?? undefined;
    let userRecord: any = null;

    if (!targetId && email) {
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any);
      if (listErr) {
        return NextResponse.json({ error: listErr.message }, { status: 500 });
      }
      const found = list?.users?.find((u: any) => u?.email === email);
      if (!found?.id) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      targetId = found.id;
      userRecord = found;
    }

    if (!targetId) {
      return NextResponse.json({ error: "Faltan user_id o email" }, { status: 400 });
    }

    if (!userRecord) {
      const { data: getUser, error: getErr } = await supabaseAdmin.auth.admin.getUserById(targetId);
      if (getErr) {
        return NextResponse.json({ error: getErr.message }, { status: 404 });
      }
      userRecord = getUser?.user;
    }

    const meta = (userRecord as any)?.user_metadata || {};
    const puuid: string | undefined = meta?.riot_puuid;
    const userEmail: string | undefined = userRecord?.email ?? email;

    // Intentar borrar datos relacionados (si existen tablas)
    const results: Record<string, any> = {};
    if (puuid) {
      results.riot_cache = await tryDelete("riot_cache", { puuid });
      results.accounts_by_puuid = await tryDelete("accounts", { puuid });
      results.matches_by_puuid = await tryDelete("matches", { puuid });
    }
    results.accounts_by_user = await tryDelete("accounts", { user_id: targetId });
    results.matches_by_user = await tryDelete("matches", { user_id: targetId });
    results.users_row = await tryDelete("users", { id: targetId });

    // Borrar usuario en Auth
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Limpiar tmp de códigos de teléfono (dev)
    let tmpRemoved = false;
    if (userEmail && ENV.NODE_ENV !== "production") {
      tmpRemoved = await removeTmpPhoneCode(userEmail);
    }

    return NextResponse.json({ ok: true, user_id: targetId, puuid: puuid ?? null, tmpRemoved, cleanup: results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}