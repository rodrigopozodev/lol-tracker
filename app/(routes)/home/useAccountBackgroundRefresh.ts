"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  toRefreshAccountsState,
  type RefreshAccountsState,
} from "@/lib/refreshAccountsUiMessage";

const POLL_MS = 2000;
const MAX_WAIT_MS = 30 * 60 * 1000;

/**
 * Encola el refresco en el servidor (respuesta HTTP inmediata) y consulta el estado
 * hasta que termina. Evita 524 de Cloudflare por peticiones largas.
 */
export function useAccountBackgroundRefresh() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [lastState, setLastState] = useState<RefreshAccountsState | null>(null);

  const run = useCallback(async (): Promise<RefreshAccountsState> => {
    setLastState(null);
    setPending(true);
    try {
      const post = await fetch("/api/home/account-refresh", {
        method: "POST",
        cache: "no-store",
      });
      const startJson = (await post.json().catch(() => ({}))) as { error?: string };
      if (!post.ok) {
        const err: RefreshAccountsState = {
          ok: false,
          updated: 0,
          errors: [],
          message: startJson.error || `No se pudo iniciar el refresco (${post.status}).`,
        };
        setLastState(err);
        return err;
      }

      const deadline = Date.now() + MAX_WAIT_MS;

      while (Date.now() < deadline) {
        const res = await fetch("/api/home/account-refresh", {
          method: "GET",
          cache: "no-store",
        });
        const j = (await res.json()) as {
          phase: string;
          result?: { ok: boolean; updated: number; errors: string[] };
        };

        if (j.phase === "finished" && j.result) {
          const ui = toRefreshAccountsState(j.result);
          setLastState(ui);
          router.refresh();
          return ui;
        }
        if (j.phase === "idle") {
          const err: RefreshAccountsState = {
            ok: false,
            updated: 0,
            errors: [],
            message: "Estado inesperado (idle) mientras se esperaba el refresco.",
          };
          setLastState(err);
          return err;
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }

      const timeout: RefreshAccountsState = {
        ok: false,
        updated: 0,
        errors: [],
        message:
          "Tiempo máximo de espera al refrescar. Si el servidor siguió trabajando, recarga la página en unos minutos.",
      };
      setLastState(timeout);
      return timeout;
    } finally {
      setPending(false);
    }
  }, [router]);

  return { run, pending, lastState };
}
