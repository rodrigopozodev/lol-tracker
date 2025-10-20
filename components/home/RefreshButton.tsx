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
      <Button onClick={onRefresh} disabled={loading} variant="secondary">
        {loading ? "Actualizando…" : "Actualizar"}
      </Button>
      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : null}
    </div>
  );
}