import SummonerSearchForm from "@/components/summoner/SummonerSearchForm";
import DisplayAd from "@/components/ads/DisplayAd";
import NeonOrbitBackground from "@/components/layout/NeonOrbitBackground";

export default function HomePage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <NeonOrbitBackground />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          League <span className="text-primary">Tracker</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Busca cualquier invocador por región y Riot ID. Estadísticas de ranked, maestrías e historial
          reciente (datos oficiales vía API de desarrolladores de Riot).
        </p>
        <div className="mt-10">
          <SummonerSearchForm />
        </div>
        <DisplayAd />
        <p className="mt-10 text-center text-xs text-muted-foreground/80">
          No estamos afiliados con Riot Games. Consulta los términos y la privacidad en el pie de página.
        </p>
      </div>
    </div>
  );
}
