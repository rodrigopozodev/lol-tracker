import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase Admin no configurado" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perRaw = parseInt(searchParams.get("perPage") || "50", 10);
    const perPage = Math.min(200, Math.max(1, isNaN(perRaw) ? 50 : perRaw));

    const { data, error } = await (supabaseAdmin as any).auth.admin.listUsers({ page, perPage });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data?.users || []).map((u: any) => {
      const m = (u?.user_metadata || {}) as Record<string, any>;
      return {
        id: u?.id ?? null,
        email: u?.email ?? null,
        phone: u?.phone ?? null,
        created_at: u?.created_at ?? null,
        last_sign_in_at: u?.last_sign_in_at ?? null,
        // Solo exponemos los campos relevantes de metadata usados por la app
        metadata: {
          riot_puuid: m.riot_puuid ?? null,
          riot_gameName: m.riot_gameName ?? null,
          riot_tagLine: m.riot_tagLine ?? null,
          riot_region: m.riot_region ?? null,
          riot_profile_icon_id: m.riot_profile_icon_id ?? null,
          riot_summoner_level: m.riot_summoner_level ?? null,
          phone_verified: m.phone_verified ?? null,
          phone: m.phone ?? null,
        },
      };
    });

    return NextResponse.json({
      page,
      perPage,
      total: (data?.total as number | undefined) ?? users.length,
      users,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}