import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de servicio | League Tracker",
  description: "Condiciones de uso de League Tracker.",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen px-4 py-12 text-foreground">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Términos de servicio</h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          League Tracker es un servicio web informativo que muestra datos de League of Legends obtenidos a
          través de la API para desarrolladores de Riot Games, sujeta a sus{" "}
          <a
            href="https://developer.riotgames.com/terms"
            className="font-medium text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            términos y condiciones
          </a>
          . No somos Riot Games ni estamos autorizados, patrocinados ni afiliados con Riot.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          El servicio se ofrece &quot;tal cual&quot;. No garantizamos disponibilidad ininterrumpida ni la
          exactitud de los datos de terceros. El uso del sitio es bajo tu propia responsabilidad y debes
          cumplir la ley aplicable y las normas de la comunidad de Riot.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Queda prohibido el abuso técnico (p. ej. intentos de eludir límites de la API, uso que interfiera
          con el servicio o con otras aplicaciones), y el uso del sitio de forma que viole las políticas de
          Riot o de nuestros proveedores (incluida la publicidad).
        </p>
        <p className="mt-6">
          <Link href="/" className="font-medium text-primary hover:underline">
            Volver al inicio
          </Link>
        </p>
      </article>
    </main>
  );
}
