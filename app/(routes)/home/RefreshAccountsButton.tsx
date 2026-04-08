"use client";

import { RefreshResultBanner } from "./RefreshResultBanner";
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

      {lastState && !pending ? <RefreshResultBanner state={lastState} /> : null}
    </div>
  );
}
