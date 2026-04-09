"use client";

import { useEffect, useRef } from "react";

/**
 * Bloque display de AdSense. Opcional:
 * - NEXT_PUBLIC_ADSENSE_SLOT = id numérico de la unidad (p. ej. 1234567890)
 * Sin slot, solo se reserva espacio (sin inicializar adsbygoogle) para evitar errores en consola.
 */
export default function DisplayAd() {
  const filled = useRef(false);
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim();

  useEffect(() => {
    if (!slot || filled.current) return;
    filled.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: object[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      /* bloqueador o script no cargado */
    }
  }, [slot]);

  if (!slot) {
    return (
      <aside
        className="mx-auto my-6 flex min-h-[90px] max-w-3xl items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-center text-xs text-muted-foreground"
        aria-hidden
      >
        Espacio reservado para publicidad (configura NEXT_PUBLIC_ADSENSE_SLOT tras crear la unidad en AdSense).
      </aside>
    );
  }

  return (
    <aside
      className="mx-auto my-6 flex min-h-[90px] max-w-3xl justify-center rounded-xl border border-border bg-card"
      aria-label="Publicidad"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", minWidth: "320px", minHeight: "90px" }}
        data-ad-client="ca-pub-7823702362685618"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
