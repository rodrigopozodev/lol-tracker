"use client";

import React, { useState } from "react";

import type { RefreshAccountsState } from "@/lib/refreshAccountsUiMessage";

import { RefreshResultBanner } from "./RefreshResultBanner";
import { useAccountBackgroundRefresh } from "./useAccountBackgroundRefresh";

export function RiotApiKeyPanel() {
  const { run, pending: refreshPending } = useAccountBackgroundRefresh();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  /** Errores de validación o de guardar la clave (antes del refresco). */
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Resultado del refresco Riot → SQLite (incluye lista de avisos por cuenta). */
  const [refreshOutcome, setRefreshOutcome] = useState<RefreshAccountsState | null>(null);

  const busy = savingKey || refreshPending;

  const submit = async () => {
    setSaveError(null);
    setRefreshOutcome(null);
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith("RGAPI-")) {
      setSaveError("La clave debe empezar por RGAPI-.");
      return;
    }
    setSavingKey(true);
    try {
      const res = await fetch("/api/settings/riot-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError((json as { error?: string })?.error || `Error ${res.status}`);
        return;
      }
      setApiKey("");

      const refresh = await run();
      let outcome: RefreshAccountsState = refresh;
      if (!refresh.ok) {
        outcome = {
          ...refresh,
          message:
            refresh.message +
            " Si en el servidor tienes RIOT_API_KEY en el entorno, tiene prioridad sobre la clave guardada aquí: actualízala o elimínala.",
        };
      }
      setRefreshOutcome(outcome);
    } catch {
      setSaveError("Error de red al guardar la clave o al consultar el estado del refresco.");
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/35 bg-[#1a0b2e] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-[#B8A9C9]">
          Cuando la clave caduque, genera una en{" "}
          <a
            href="https://developer.riotgames.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-purple-300 underline underline-offset-2 hover:text-white"
          >
            developer.riotgames.com
          </a>{" "}
          y pégala abajo.
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setSaveError(null);
            setRefreshOutcome(null);
          }}
          className="shrink-0 rounded-lg border border-purple-500/50 bg-purple-600/30 px-5 py-2.5 text-base font-semibold text-white hover:bg-purple-600/50"
        >
          {open ? "Cerrar" : "Actualizar clave API"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-purple-500/20 pt-4">
          <label className="block text-sm text-[#B8A9C9]">
            Clave Riot (<code className="text-purple-300">RGAPI-…</code>)
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Pega aquí la clave completa"
              className="mt-1 w-full rounded-lg border border-purple-500/30 bg-[#0a0416] px-3 py-2.5 font-mono text-base text-white placeholder:text-gray-500"
            />
          </label>
          <p className="text-sm text-[#8a7a9a]">
            En local (<code className="text-purple-400">npm run dev</code>) suele bastar pegar y guardar. En el VPS
            con <code className="text-purple-400">npm run start</code> añade en el entorno:{" "}
            <code className="text-purple-300">RIOT_ALLOW_UNSAFE_KEY_UPDATE=true</code> (solo tú / red privada).
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 py-3.5 text-base font-semibold text-white hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {busy ? (savingKey && !refreshPending ? "Guardando clave…" : "Actualizando datos…") : "Guardar clave"}
          </button>

          {refreshPending ? (
            <p className="text-sm text-[#B8A9C9]">
              Descargando datos en segundo plano… suele tardar varios minutos. Abajo verás el detalle de cada cuenta
              cuando termine.
            </p>
          ) : null}

          {saveError ? <p className="text-base text-red-300">{saveError}</p> : null}

          {refreshOutcome && !refreshPending ? <RefreshResultBanner state={refreshOutcome} /> : null}
        </div>
      )}
    </div>
  );
}
