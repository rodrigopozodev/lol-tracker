"use client";
import dynamic from "next/dynamic";
const InfinityLines = dynamic(() => import("@/components/InfinityLines"), { ssr: false });
import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AuthPageLayout({ title, subtitle, children }: Props) {
  return (
    <main className="relative flex justify-center items-center min-h-screen overflow-hidden px-4 sm:px-0" suppressHydrationWarning>
      <InfinityLines />

      {/* Contenedor relativo para el borde animado */}
      <div className="relative w-full max-w-[420px] sm:max-w-[440px] z-10">
        {/* Borde animado */}
        <div
          className="rounded-2xl p-[3px] animate-border-flow"
          style={{
            borderStyle: "solid",
            borderWidth: "3px",
            borderImage: "linear-gradient(90deg, #4fd1ff, var(--color-form-ring), #ff6ec7) 1",
          }}
        >
          {/* Contenedor interior transparente */}
          <div className="rounded-2xl p-6 sm:p-8 bg-transparent">
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold mb-2 text-center text-[color:var(--color-form-foreground)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[color:var(--color-form-placeholder)] text-center mb-4">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
