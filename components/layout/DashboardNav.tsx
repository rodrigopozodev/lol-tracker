"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        // Si falla, igualmente intentamos llevar al login
        console.warn("Logout falló", await res.text());
      }
      router.replace("/auth/login");
    } catch (e) {
      router.replace("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="rounded-2xl bg-[color:var(--color-form-bg)]/65 backdrop-blur-xl border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/25 shadow-xl px-4 py-3 flex items-center justify-between">
      {/* Espaciador a la izquierda para mantener balance visual */}
      <div className="w-24" aria-hidden="true" />

      {/* Navegación centrada */}
      <div className="mx-auto flex items-center gap-6">
        <Link
          href="/home"
          className="text-sm font-semibold text-[color:var(--color-form-foreground)] hover:text-[color:var(--color-form-accent)] transition-colors"
          aria-label="Ir a Home"
        >
          Home
        </Link>
        <Link
          href="/multi-search"
          className="text-sm font-semibold text-[color:var(--color-form-foreground)] hover:text-[color:var(--color-form-accent)] transition-colors"
          aria-label="Ir a Multi-search"
        >
          Multi-search
        </Link>
      </div>

      {/* Acciones a la derecha */}
      <div className="flex items-center gap-3">
        <Button onClick={logout} disabled={loading} variant="secondary">
          {loading ? "Saliendo..." : "Cerrar sesión"}
        </Button>
      </div>
    </nav>
  );
}