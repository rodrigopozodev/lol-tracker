import { cookies } from "next/headers";
import { parseSessionCookie } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import DashboardNav from "@/components/layout/DashboardNav";
import RefreshButton from "@/components/home/RefreshButton";

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

  if (!session?.user?.id || !supabaseAdmin) {
    return null;
  }

  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(session.user.id);
  const meta = (userData?.user as any)?.user_metadata || {};

  const profileIconUrl = meta?.riot_profile_icon_id
    ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${meta.riot_profile_icon_id}.jpg`
    : null;
  const displayName = meta?.riot_gameName ?? meta?.riot_summoner_name ?? "—";
  const displayTag = meta?.riot_tagLine ? `#${meta.riot_tagLine}` : "";
  const regionLabel = clusterToLabel(meta?.riot_region ?? null);
  const level = meta?.riot_summoner_level ?? null;

  return (
    <div className="grid gap-6">
      <DashboardNav />

      {/* Header sin llamadas a la API: datos leídos directamente de BD */}
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
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--color-form-foreground)] flex items-center gap-3">
              <span>
                {displayName}
                {displayTag && (
                  <span className="text-[color:var(--color-form-placeholder)] ml-1">{displayTag}</span>
                )}
              </span>
              {/* Botón Actualizar: sólo al hacer clic se llama a la API */}
              <RefreshButton />
            </div>
            <div className="mt-1 text-xs sm:text-sm text-[color:var(--color-form-placeholder)] flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[color:var(--color-form-foreground)]/85">
                {regionLabel}
              </span>
              <span>• Nivel {typeof level === "number" ? level : "—"}</span>
            </div>
            {meta?.riot_last_updated ? (
              <div className="mt-2 text-[10px] text-[color:var(--color-form-placeholder)]">Actualizado: {new Date(meta.riot_last_updated).toLocaleString()}</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Espacio para más bloques leídos desde BD en el futuro */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[color:var(--color-form-placeholder)]">
        No se realizan llamadas automáticas a la API en esta página. Usa "Actualizar" para obtener y guardar los últimos datos.
      </div>
    </div>
  );
}