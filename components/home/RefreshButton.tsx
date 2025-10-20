"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/home/refresh-summoner", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Error actualizando datos");
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
    <div className="inline-flex items-center gap-2">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-gradient-to-r from-[#7e22ce] to-[#a855f7] text-white font-bold hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-300 disabled:opacity-60"
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
    </div>
  );
}