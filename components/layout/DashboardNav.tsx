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
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm font-semibold text-[color:var(--color-form-foreground)]">Dashboard</Link>
        <span className="text-xs text-[color:var(--color-form-placeholder)]">Tu cuenta</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="hidden sm:inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[color:var(--color-form-foreground)] px-3 py-2 text-sm transition-colors"
        >
          Ajustes
        </Link>
        <Button onClick={logout} disabled={loading} variant="secondary">
          {loading ? "Saliendo..." : "Cerrar sesión"}
        </Button>
      </div>
    </nav>
  );
}