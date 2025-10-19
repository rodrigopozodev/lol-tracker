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
      <div className="bg-[color:var(--color-form-bg)]/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-[420px] sm:max-w-[440px] border border-[color:var(--color-form-border)]/40 ring-1 ring-[color:var(--color-form-ring)]/20">
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
    </main>
  );
}