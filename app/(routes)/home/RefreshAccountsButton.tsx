"use client";

import type { RefreshAccountsState } from "@/lib/refreshAccountsUiMessage";

import { useAccountBackgroundRefresh } from "./useAccountBackgroundRefresh";

function SubmitLabel({ pending }: { pending: boolean }) {
  return pending ? "Actualizando…" : "Refrescar datos ahora";
}

export function RefreshAccountsButton() {
  const { run, pending, lastState } = useAccountBackgroundRefresh();

  return (
    <div className="flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:items-end">
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-purple-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
        >
          <SubmitLabel pending={pending} />
        </button>
      </form>

      {pending ? (
        <p className="max-w-md text-left text-sm leading-snug text-[#B8A9C9] sm:text-right">
          El servidor está descargando datos en segundo plano (la conexión no se corta por tiempo de espera del
          proxy). Suele tardar <strong className="text-purple-200">1–5 minutos</strong> con varias cuentas. Puedes
          dejar esta pestaña abierta; al terminar verás el resultado abajo.
        </p>
      ) : null}

      {lastState && !pending ? <ResultBanner state={lastState} /> : null}
    </div>
  );
}

function ResultBanner({ state }: { state: RefreshAccountsState }) {
  const success = state.ok && state.updated > 0 && state.errors.length === 0;
  const partial = state.ok && state.updated > 0 && state.errors.length > 0;
  const neutral = state.ok && state.updated === 0;

  return (
    <div
      className={`rounded-lg border px-4 py-2.5 text-base ${
        success
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
          : partial
            ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
            : neutral
              ? "border-amber-500/40 bg-amber-950/30 text-amber-100/95"
              : "border-red-500/40 bg-red-500/10 text-red-100"
      }`}
      role="status"
    >
      <p className="font-medium">{state.message}</p>
      {state.errors.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-sm opacity-95">
          {state.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
