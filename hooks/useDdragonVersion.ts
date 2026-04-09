"use client";

import { useEffect, useState } from "react";
import { DDRAGON_VERSION_FALLBACK } from "@/lib/ddragon/cdnVersion";

/** Versión actual de Data Dragon (CDN) para sprites e iconos. */
export function useDdragonVersion(): string {
  const [v, setV] = useState(DDRAGON_VERSION_FALLBACK);
  useEffect(() => {
    fetch("/api/ddragon/version")
      .then((r) => r.json())
      .then((j: { version?: string }) => {
        if (typeof j.version === "string") setV(j.version);
      })
      .catch(() => {});
  }, []);
  return v;
}
