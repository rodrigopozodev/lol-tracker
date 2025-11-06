import { cookies, headers } from "next/headers";
import { parseSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DashboardNav from "@/components/layout/DashboardNav";
import RefreshButton from "@/components/home/RefreshButton";
import DashboardLines from "@/components/DashboardLines";
import ProfileIcon from "@/components/home/ProfileIcon";
import RankSwitcher from "@/components/home/RankSwitcher";
import PublicSearch from "@/components/home/PublicSearch";
import HomeArticle from "@/components/home/HomeArticle";
import Script from "next/script";

function clusterToLabel(cluster?: string | null) {
  const map: Record<string, string> = {
    euw1: "EUW",
    eun1: "EUNE",
    na1: "NA",
    kr: "KR",
    br1: "BR",
    la1: "LAS",
    la2: "LAN",
    jp1: "JP",
    oc1: "OCE",
    ru: "RU",
    tr1: "TR",
  };
  return (cluster && map[cluster]) || "—";
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = parseSessionCookie(cookie);
  const userId = session?.user?.id;
  let meta: any = {};
  if (userId && supabaseAdmin) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    meta = (userData?.user as any)?.user_metadata || {};
  }

  const profileIconUrl = meta?.riot_profile_icon_id
    ? `https://ddragon.leagueoflegends.com/cdn/14.21.1/img/profileicon/${meta.riot_profile_icon_id}.png`
    : null;
  const displayName = meta?.riot_gameName ?? meta?.riot_summoner_name ?? "—";
  const displayTag = meta?.riot_tagLine ? `#${meta.riot_tagLine}` : "";
  const regionLabel = clusterToLabel(meta?.riot_region ?? null);
  const level = meta?.riot_summoner_level ?? null;

  // Obtener rango Solo/Duo y Flex por PUUID (como Dashboard)
  let leagueSolo: any = null;
  let leagueFlex: any = null;
  try {
    const puuid: string | undefined = meta?.riot_puuid;
    if (puuid) {
      const headersList = await headers();
      const protocol = headersList.get("x-forwarded-proto") || "http";
      const host = headersList.get("host") || "localhost:3000";
      const leagueUrl = `${protocol}://${host}/api/riot/league?puuid=${encodeURIComponent(puuid)}`;
      const leagueRes = await fetch(leagueUrl, { cache: "no-store" });
      if (leagueRes.ok) {
        const leagueJson = await leagueRes.json();
        leagueSolo = leagueJson?.solo || null;
        leagueFlex = leagueJson?.flex || null;
      }
    }
  } catch {}

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0416]">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <DashboardLines />
      </div>
      <section className="relative z-10 mx-auto w-full max-w-4xl px-3 sm:px-6 py-6">
        <DashboardNav authedInitial={!!userId} />

        <div className="mt-8">
          {/* Título */}
          

          {/* Tarjeta de usuario */}
          {userId ? (
            <div className="relative rounded-2xl bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all duration-300 animate-fadeIn">
              <div className="flex flex-col items-center text-center gap-4">
                {/* Icono de perfil grande */}
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-purple-900/30 border-2 border-purple-500/50">
                  <ProfileIcon src={profileIconUrl} size={112} />
                </div>

                {/* Nombre y tag */}
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {displayName}
                  <span className="text-purple-300">{displayTag}</span>
                </div>

                {/* Rango debajo del nombre */}
                <RankSwitcher solo={leagueSolo} flex={leagueFlex} />

                {/* Región y nivel */}
                <div className="text-[#B8A9C9] mt-1">
                  {regionLabel} • Nivel {level || "—"}
                </div>

                {/* Actualizado */}
                {meta?.riot_last_updated && (
                  <div className="text-[#B8A9C9]/70 text-sm">
                    Actualizado: {new Date(meta.riot_last_updated).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
              {/* Botón responsive - esquina en desktop, centrado abajo en móvil */}
              <div className="absolute top-4 right-4 hidden md:block">
                <RefreshButton />
              </div>
              <div className="block md:hidden mt-4 pt-4 border-t border-purple-500/20">
                <div className="flex justify-center">
                  <RefreshButton />
                </div>
              </div>
            </div>
          ) : (
            <PublicSearch />
          )}

          {/* Tarjeta de información */}
          <div className="mt-4 rounded-2xl bg-[#1a0b2e] border border-purple-500/30 p-6 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all duration-300">
            <p className="text-[#B8A9C9] text-sm">
              {userId
                ? 'No se realizan llamadas automáticas a la API en esta página. Usa "Actualizar" para obtener y guardar los últimos datos.'
                : 'Busca cualquier invocador por Riot ID (GameName#TAG) para ver nivel y ranking. No guardamos datos sin sesión.'}
            </p>
          </div>

          {/* Bloque editorial para cumplir requisitos de contenido */}
          <HomeArticle />
        </div>
      </section>
      {/* Cargar AdSense sólo en Home */}
      <Script
        id="adsense-home"
        strategy="afterInteractive"
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7823702362685618"
        crossOrigin="anonymous"
      />
    </main>
  );
}