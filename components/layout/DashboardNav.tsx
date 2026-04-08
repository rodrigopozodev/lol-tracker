"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardNav() {
  return (
    <nav className="relative z-20 flex flex-wrap items-center justify-center gap-5 px-4 py-4 md:gap-8">
      <Link href="/home" className="flex items-center gap-2" aria-label="League Tracker - Home">
        <Image src="/LoL-Tracker.png" alt="League Tracker" width={72} height={72} className="cursor-pointer" />
      </Link>

      <Link
        href="/home"
        className="hidden text-base font-semibold text-[color:var(--color-form-foreground)] hover:text-purple-600 md:block"
      >
        Home
      </Link>
      <Link
        href="/top-campeones"
        className="hidden text-base font-semibold text-[color:var(--color-form-foreground)] hover:text-purple-600 md:block"
      >
        Top campeones
      </Link>
      <Link
        href="/mashups"
        className="hidden text-base font-semibold text-[color:var(--color-form-foreground)] hover:text-purple-600 md:block"
      >
        Mashups
      </Link>

      <Link href="/home" className="md:hidden" aria-label="Home">
        <svg
          className="h-7 w-7 text-[color:var(--color-form-foreground)] hover:text-purple-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a1.5 1.5 0 01-1.5 1.5H4.5A1.5 1.5 0 013 21V9.75z" />
        </svg>
      </Link>
      <Link href="/top-campeones" className="md:hidden" aria-label="Top campeones">
        <span className="text-sm font-bold text-purple-300">T</span>
      </Link>
      <Link href="/mashups" className="md:hidden" aria-label="Mashups">
        <span className="text-sm font-bold text-purple-300">M</span>
      </Link>
    </nav>
  );
}
