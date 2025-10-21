"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function DashboardNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) console.warn("Logout falló", await res.text());
      router.replace("/auth/login");
    } catch {
      router.replace("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="px-4 py-3 flex items-center justify-center gap-6">
      {/* Logo */}
      <Link
        href="/home"
        className="flex items-center gap-2 cursor-pointer"
        aria-label="League Tracker - Home"
      >
        <Image
          src="/LoL-Tracker.png"
          alt="League Tracker"
          width={60}
          height={60}
          className="cursor-pointer"
        />
      </Link>

      {/* Home - texto en desktop, SVG en móvil */}
      <Link
        href="/home"
        className="flex items-center cursor-pointer"
        aria-label="Home"
      >
        {/* Desktop: texto */}
        <span className="hidden md:block text-sm font-semibold text-[color:var(--color-form-foreground)] hover:text-purple-600 transition-colors">
          Home
        </span>
        {/* Móvil: SVG */}
        <svg
          className="block md:hidden h-6 w-6 text-[color:var(--color-form-foreground)] transition-transform duration-300 ease-in-out hover:text-purple-600 hover:scale-125"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 21V9.75z"
          />
        </svg>
      </Link>

      {/* Multi-Search - texto en desktop, SVG en móvil */}
      <Link
        href="/multi-search"
        className="flex items-center cursor-pointer"
        aria-label="Multi-Search"
      >
        {/* Desktop: texto */}
        <span className="hidden md:block text-sm font-semibold text-[color:var(--color-form-foreground)] hover:text-purple-600 transition-colors">
          Multi-Search
        </span>
        {/* Móvil: SVG */}
        <svg
          className="block md:hidden h-6 w-6 text-[color:var(--color-form-foreground)] transition-transform duration-300 ease-in-out hover:text-purple-600 hover:scale-125"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M16.65 16.65a7.5 7.5 0 10-10.6-10.6 7.5 7.5 0 0010.6 10.6z"
          />
        </svg>
      </Link>

      {/* Botón de cerrar sesión con SVG sin marco */}
      <Button
        onClick={logout}
        disabled={loading}
        variant="secondary"
        className="cursor-pointer flex items-center justify-center p-0 bg-transparent border-0 ring-0 shadow-none group"
        aria-label="Cerrar sesión"
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-[color:var(--color-form-foreground)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 100 20v-4l-5 5 5 5v-4a8 8 0 01-8-8z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-[color:var(--color-form-foreground)] transition-transform duration-300 ease-in-out group-hover:text-purple-600 group-hover:scale-125"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
            />
          </svg>
        )}
      </Button>
    </nav>
  );
}
