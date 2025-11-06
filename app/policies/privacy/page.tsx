import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0a0416] text-white">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Política de Privacidad</h1>
        <p className="mt-4 text-[#B8A9C9]">
          Respetamos su privacidad. Solo almacenamos la información necesaria para operar League Tracker, como datos de usuario
          y métricas de progreso. No vendemos datos personales y aplicamos medidas de seguridad. Al usar el servicio, usted acepta
          el procesamiento de sus datos para las funcionalidades descritas.
        </p>
        <p className="mt-3 text-[#B8A9C9]">
          Puede solicitar la eliminación de su cuenta y datos enviando un correo de soporte. Consulte los Términos de Servicio para
          más detalles sobre uso permitido y responsabilidades.
        </p>
      </section>
    </main>
  );
}