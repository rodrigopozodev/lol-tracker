import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { attachSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ENV } from "@/config/env";

export async function POST(req: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Faltan email y contraseña" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Refrescar metadata de Riot usando PUUID guardado
    const userId = data.user?.id;
    if (userId && supabaseAdmin) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        const meta = (userData?.user as any)?.user_metadata || {};
        const puuid: string | undefined = meta?.riot_puuid;
        if (puuid) {
          const riotUrl = `${ENV.APP_URL}/api/riot/summoner?puuid=${encodeURIComponent(puuid)}`;
          const riotRes = await fetch(riotUrl, { cache: "no-store" });
          if (riotRes.ok) {
            const riotJson = await riotRes.json();
            const updated = {
              ...meta,
              riot_puuid: puuid,
              riot_gameName: riotJson?.gameName ?? meta.riot_gameName ?? null,
              riot_tagLine: riotJson?.tagLine ?? meta.riot_tagLine ?? null,
              riot_summoner_name: riotJson?.name ?? meta.riot_summoner_name ?? null,
              riot_profile_icon_id: riotJson?.profileIconId ?? meta.riot_profile_icon_id ?? null,
              riot_summoner_level: riotJson?.summonerLevel ?? meta.riot_summoner_level ?? null,
              riot_region: riotJson?.region ?? meta.riot_region ?? null,
              riot_last_updated: Date.now(),
            } as Record<string, any>;
            await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: updated });
          }
        }
      } catch (e) {
        console.warn("[login] riot metadata refresh error", (e as any)?.message || e);
      }
    }

    const res = NextResponse.json({
      message: "Login correcto",
      user_id: data.user?.id ?? null,
      session: {
        access_token: data.session?.access_token ?? null,
        expires_at: data.session?.expires_at ?? null,
      },
    });
    attachSessionCookie(res, { user: { email, id: data.user?.id ?? undefined } });
    return res;
  } catch (err: any) {
    console.error("[login] route error", err);
    return NextResponse.json({ error: err?.message ?? "Error inesperado" }, { status: 400 });
  }
}