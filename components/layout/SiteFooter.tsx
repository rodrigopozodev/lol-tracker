import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t-4 border-primary bg-brand-black px-4 py-10 text-white/85">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link href="/policies/terms" className="text-primary hover:text-primary/90 hover:underline">
            Términos
          </Link>
          <Link href="/policies/privacy" className="text-primary hover:text-primary/90 hover:underline">
            Privacidad
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-white/70">
          League Tracker no está autorizado ni respaldado por Riot Games. League of Legends y Riot Games
          son marcas comerciales o marcas registradas de Riot Games, Inc. Los datos de partidas provienen
          de la API de desarrolladores de Riot según sus términos.
        </p>
      </div>
    </footer>
  );
}
