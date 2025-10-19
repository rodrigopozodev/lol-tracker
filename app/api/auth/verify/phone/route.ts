import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin no configurado" }, { status: 500 });
  }
  try {
    const { user_id, code, email } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Faltan code" }, { status: 400 });
    }

    const codeStr = String(code);
    if (!/^\d{6}$/.test(codeStr)) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // Normalizar user_id para evitar "null"/"undefined" como string
    let targetUserId: string | null =
      typeof user_id === "string" && user_id && user_id !== "null" && user_id !== "undefined"
        ? user_id
        : null;

    // Intentar obtener usuario por ID, con fallback por email si no existe
    let userRecord: any | null = null;
    if (targetUserId) {
      const { data: byId, error: getErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (getErr || !byId?.user) {
        // Fallback: buscar por email si lo tenemos
        if (email) {
          const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any);
          if (!listErr && list?.users?.length) {
            const found = list.users.find((u: any) => u?.email === email);
            if (found?.id) {
              targetUserId = found.id;
              userRecord = found;
            }
          }
        }
        if (!userRecord) {
          return NextResponse.json({ error: getErr?.message || "Usuario no encontrado" }, { status: 404 });
        }
      } else {
        userRecord = byId.user;
      }
    } else if (email) {
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any);
      if (listErr || !list?.users?.length) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      const found = list.users.find((u: any) => u?.email === email);
      if (!found?.id) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      targetUserId = found.id;
      userRecord = found;
    } else {
      return NextResponse.json({ error: "Faltan identificadores (user_id/email) y code" }, { status: 400 });
    }

    let meta = (userRecord as any)?.user_metadata || {};

    // Fallback en desarrollo: si no hay phone_code en metadata, mirar tmp/phone-codes.json por email
    if (!meta?.phone_code && process.env.NODE_ENV !== "production" && email) {
      try {
        const tmpPath = path.resolve(process.cwd(), "tmp", "phone-codes.json");
        const buf = await fs.readFile(tmpPath, "utf8");
        const map = JSON.parse(buf || "{}");
        const entry = map[email];
        if (entry?.code) {
          // Validar contra el tmp
          if (String(entry.code) !== codeStr) {
            return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
          }
          // Marcar verificado aunque metadata no tenga phone_code
          const { data: reload } = await supabaseAdmin.auth.admin.getUserById(targetUserId as string);
          const existingMeta = (reload?.user as any)?.user_metadata || {};
          const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId as string, {
            user_metadata: { ...existingMeta, phone_verified: true, phone_code: null },
          });
          if (updErr) {
            return NextResponse.json({ error: updErr.message }, { status: 500 });
          }
          return NextResponse.json({ message: "Teléfono verificado", status: "phone_verified" });
        }
      } catch {}
    }

    if (!meta?.phone_code) {
      return NextResponse.json({ error: "No hay código de verificación pendiente" }, { status: 400 });
    }

    if (String(meta.phone_code) !== codeStr) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    }

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId as string, {
      user_metadata: { ...meta, phone_verified: true, phone_code: null },
    });
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Teléfono verificado", status: "phone_verified" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}