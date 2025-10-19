import { cookies, headers } from "next/headers";
import { parseSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DashboardNav from "@/components/layout/DashboardNav";

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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = parseSessionCookie(cookie);

  // Si no hay sesión o no está Supabase Admin, no renderizamos nada
  if (!session?.user?.id || !supabaseAdmin) {
    return null;
  }

  // Obtener metadata del usuario (puuid)
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(session.user.id);
  const meta = (userData?.user as any)?.user_metadata || {};
  const puuid: string | null = meta?.riot_puuid ?? null;

  // Si el usuario no tiene PUUID configurado, no renderizamos contenido
  if (!puuid) {
    return null;
  }

  // Consultar datos del invocador por PUUID (ruta relativa para evitar puertos/envs)
  let data: any = null;
  let league: any = null;
  let matches: any[] = [];
  try {
    const headersList = await headers();
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const host = headersList.get("host") || "localhost:3000";

    const summonerUrl = `${protocol}://${host}/api/riot/summoner?puuid=${encodeURIComponent(puuid)}`;
    const leagueUrl = `${protocol}://${host}/api/riot/league?puuid=${encodeURIComponent(puuid)}`;
    const matchesUrl = `${protocol}://${host}/api/riot/matches?puuid=${encodeURIComponent(puuid)}&count=8`;

    const [summonerRes, leagueRes, matchesRes] = await Promise.all([
      fetch(summonerUrl, { cache: "no-store" }),
      fetch(leagueUrl, { cache: "no-store" }),
      fetch(matchesUrl, { cache: "no-store" }),
    ]);

    if (!summonerRes.ok) return null;
    data = await summonerRes.json();

    if (leagueRes.ok) {
      league = await leagueRes.json();
    }
    if (matchesRes.ok) {
      const mJson = await matchesRes.json();
      matches = Array.isArray(mJson?.matches) ? mJson.matches : [];
    }
  } catch {
    return null;
  }

  const profileIconUrl = data?.profileIconId
    ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${data.profileIconId}.jpg`
    : null;
  const displayName = data?.gameName ?? data?.name ?? "—";
  const displayTag = data?.tagLine ? `#${data.tagLine}` : "";
  const regionLabel = clusterToLabel(data?.region ?? null);

  // Helpers de liga
  const solo = league?.solo || null;
  const flex = league?.flex || null;
  const formatRank = (entry: any | null) => {
    if (!entry) return "Sin clasificación";
    const tier = entry.tier || "";
    const rank = entry.rank || "";
    const lp = typeof entry.leaguePoints === "number" ? `${entry.leaguePoints} LP` : "0 LP";
    return `${tier} ${rank} · ${lp}`.trim();
  };

  return (
    <div className="grid gap-6">
      <DashboardNav />
      {/* Header de perfil */}
      <div className="rounded-2xl bg-[color:var(--color-form-bg)]/65 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/25 shadow-xl p-5 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {profileIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Icono de perfil"
              src={profileIconUrl}
              width={72}
              height={72}
              className="rounded-xl object-cover"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-xl bg-black/20" />
          )}

          <div className="flex-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--color-form-foreground)]">
              {displayName}
              {displayTag && (
                <span className="text-[color:var(--color-form-placeholder)] ml-1">{displayTag}</span>
              )}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-[color:var(--color-form-placeholder)] flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[color:var(--color-form-foreground)]/85">
                {regionLabel}
              </span>
              <span>• Nivel {data?.summonerLevel ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo: izquierda ranked + flex, derecha partidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6">
          <section className="rounded-2xl bg-[color:var(--color-form-bg)]/60 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/20 shadow-xl">
            <header className="px-5 pt-4">
              <h3 className="text-sm font-semibold tracking-wide text-[color:var(--color-form-foreground)]">Ranked Solo/Duo</h3>
            </header>
            <div className="p-5">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[color:var(--color-form-gradient-from)]/40" />
                <div>
                  <div className="text-base font-semibold text-[color:var(--color-form-foreground)]">{formatRank(solo)}</div>
                  {solo ? (
                    <div className="text-xs text-[color:var(--color-form-placeholder)]">{solo.wins}W / {solo.losses}L</div>
                  ) : (
                    <div className="text-xs text-[color:var(--color-form-placeholder)]">Sin datos</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-[color:var(--color-form-bg)]/60 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/20 shadow-xl">
            <header className="px-5 pt-4">
              <h3 className="text-sm font-semibold tracking-wide text-[color:var(--color-form-foreground)]">Ranked Flex</h3>
            </header>
            <div className="p-5">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[color:var(--color-form-gradient-to)]/40" />
                <div>
                  <div className="text-base font-semibold text-[color:var(--color-form-foreground)]">{formatRank(flex)}</div>
                  {flex ? (
                    <div className="text-xs text-[color:var(--color-form-placeholder)]">{flex.wins}W / {flex.losses}L</div>
                  ) : (
                    <div className="text-xs text-[color:var(--color-form-placeholder)]">Sin datos</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Columna derecha */}
        <section className="rounded-2xl bg-[color:var(--color-form-bg)]/60 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/20 shadow-xl">
          <header className="px-5 pt-4">
            <h3 className="text-sm font-semibold tracking-wide text-[color:var(--color-form-foreground)]">Recent Games</h3>
          </header>
          <div className="p-5">
            {matches && matches.length > 0 ? (
              <ul className="grid gap-3">
                {matches.map((m) => (
                  <li key={m.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs ${m.win ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                        {m.win ? "Win" : "Loss"}
                      </div>
                      <div className="text-[color:var(--color-form-foreground)] text-sm">
                        {m.queueLabel} • {m.champion || "?"}
                      </div>
                    </div>
                    <div className="text-xs text-[color:var(--color-form-placeholder)]">
                      {typeof m.kills === "number" ? `${m.kills}/${m.deaths}/${m.assists}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-[color:var(--color-form-placeholder)]">Aún no hay partidas recientes.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
