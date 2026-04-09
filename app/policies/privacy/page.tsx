import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidad | League Tracker",
  description: "Política de privacidad de League Tracker.",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen px-4 py-12 text-foreground">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Política de privacidad</h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          League Tracker, en su versión actual, es principalmente un buscador de perfiles públicos de League
          of Legends. Los datos de partidas y clasificatorias se obtienen de los servidores de Riot mediante
          su API oficial; no es obligatorio crear cuenta en nuestro sitio para usar el buscador.
        </p>
        <h2 className="mt-8 text-xl font-semibold text-foreground">Proveedores y tecnologías</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Riot Games API:</strong> el tratamiento de datos de jugador por
            parte de Riot se rige por sus políticas.
          </li>
          <li>
            <strong className="text-foreground">Google AdSense:</strong> si activas anuncios en el sitio, Google
            puede usar cookies y tecnologías similares según su{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              className="font-medium text-primary underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              política de publicidad
            </a>
            .
          </li>
        </ul>
        <h2 className="mt-8 text-xl font-semibold text-foreground">Datos de servidor y registros</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          El hosting (p. ej. Vercel) puede generar registros técnicos (IP, user-agent, errores) para operar y
          proteger el servicio. Conserva esos datos solo el tiempo necesario según el proveedor.
        </p>
        <h2 className="mt-8 text-xl font-semibold text-foreground">Tus derechos (RGPD / UE)</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Si en el futuro se ofrece registro de usuario o se tratan datos personales adicionales, describiremos
          aquí la base legal, conservación y cómo ejercer acceso, rectificación o supresión. Mientras el uso sea
          solo consulta pública sin cuenta, la información mostrada es la que Riot expone como datos de juego.
        </p>
        <p className="mt-8">
          <Link href="/" className="font-medium text-primary hover:underline">
            Volver al inicio
          </Link>
        </p>
      </article>
    </main>
  );
}
