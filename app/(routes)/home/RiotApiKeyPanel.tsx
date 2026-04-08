"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useAccountBackgroundRefresh } from "./useAccountBackgroundRefresh";

export function RiotApiKeyPanel() {
  const router = useRouter();
  const { run, pending: refreshPending } = useAccountBackgroundRefresh();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const busy = savingKey || refreshPending;

  const submit = async () => {
    setMessage(null);
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith("RGAPI-")) {
      setMessage({ type: "err", text: "La clave debe empezar por RGAPI-." });
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
        setMessage({ type: "err", text: (json as { error?: string })?.error || `Error ${res.status}` });
        return;
      }
      setMessage({
        type: "ok",
        text: "Clave guardada. Descargando datos en segundo plano (sin cortar por timeout del proxy)…",
      });
      setApiKey("");

      const refresh = await run();
      if (!refresh.ok) {
        setMessage({
          type: "err",
          text:
            refresh.message +
            " Si en el servidor tienes RIOT_API_KEY en el entorno, tiene prioridad sobre la clave guardada aquí: actualízala o elimínala.",
        });
      } else {
        setMessage({
          type: "ok",
          text:
            refresh.message +
            (refresh.updated === 0
              ? " Si no ves cambios, recarga la página en un momento."
              : ""),
        });
      }
      router.refresh();
    } catch {
      setMessage({ type: "err", text: "Error de red al guardar la clave o al consultar el estado del refresco." });
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
            setMessage(null);
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
          {message && (
            <p
              className={
                message.type === "ok"
                  ? "text-base text-emerald-300"
                  : "text-base text-red-300"
              }
            >
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
