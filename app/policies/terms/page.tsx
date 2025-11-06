import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#0a0416] text-white">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Términos de Servicio</h1>
        <p className="mt-4 text-[#B8A9C9]">
          League Tracker es una herramienta informativa. Usted es responsable de su uso del servicio y de cumplir las políticas de
          Riot Games y de nuestra plataforma. No garantizamos la disponibilidad continua ni la exactitud de datos de terceros.
        </p>
        <p className="mt-3 text-[#B8A9C9]">
          Se prohíbe el abuso del sistema, el uso automatizado no autorizado y la reventa de acceso. Podemos suspender cuentas que
          incumplan estas reglas. El servicio se proporciona "tal cual" y puede cambiar sin previo aviso.
        </p>
      </section>
    </main>
  );
}