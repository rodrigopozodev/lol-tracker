"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const onRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/home/refresh-summoner", { method: "POST" });
      if (!res.ok) {
        let msg = "";
        try {
          const j = await res.json();
          msg = j?.error || j?.message || "";
        } catch {
          msg = await res.text();
        }
        if (res.status === 502 && (msg?.toLowerCase().includes("token inválido") || msg?.toLowerCase().includes("caducado"))) {
          setShowModal(true);
        } else {
          setError(msg || "Error actualizando datos");
        }
      } else {
        // Vuelve a renderizar datos del servidor sin recargar toda la página
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative inline-flex items-center gap-2">
      <span
        role="tooltip"
        className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-normal max-w-[280px] rounded-md bg-black/80 text-white text-xs px-3 py-2 border border-white/10 shadow z-50 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 transition-all duration-200"
      >
        No se realizan llamadas automáticas a la API en esta página. Usa "Actualizar" para obtener y guardar los últimos datos.
      </span>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-3 py-2 md:px-4 md:py-2 rounded-md bg-gradient-to-r from-[#7e22ce] to-[#a855f7] text-white font-bold hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300 disabled:opacity-60 text-sm md:text-base min-w-[120px] md:min-w-[140px]"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Actualizando...
          </span>
        ) : (
          "Actualizar datos"
        )}
      </button>
      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : null}

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-xl bg-[color:var(--color-form-bg)] border border-[color:var(--color-form-border)] p-5 w-[90%] max-w-sm">
            <h2 className="text-lg font-bold text-white">API key caducada</h2>
            <p className="mt-1 text-sm text-[#B8A9C9]">Actualiza la clave en la configuración del servidor y vuelve a intentar.</p>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}