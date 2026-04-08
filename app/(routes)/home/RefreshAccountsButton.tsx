"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { refreshAccountsAction, type RefreshAccountsState } from "./actions";

const LONG_WAIT_MS = 120_000;

function SubmitLabel({ pending }: { pending: boolean }) {
  return pending ? "Actualizando…" : "Refrescar datos ahora";
}

export function RefreshAccountsButton() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(refreshAccountsAction, null);
  const prevPending = useRef<boolean>(false);
  const [longWait, setLongWait] = useState(false);

  useEffect(() => {
    const wasPending = prevPending.current;
    prevPending.current = pending;
    // Cuando pasa de "pendiente" a "no pendiente", refrescamos para ver datos nuevos.
    if (wasPending && !pending) {
      router.refresh();
    }
  }, [pending, router]);

  useEffect(() => {
    if (!pending) {
      setLongWait(false);
      return;
    }
    const id = window.setTimeout(() => setLongWait(true), LONG_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [pending]);

  return (
    <div className="flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:items-end">
      <form action={formAction} className="inline">
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
          Suele tardar <strong className="text-purple-200">1–5 minutos</strong> con varias cuentas (Riot + partidas +
          ligas). El botón vuelve solo al terminar.
          {longWait ? (
            <>
              {" "}
              Si lleva <strong className="text-amber-200">más de ~2 minutos</strong> sin cambiar, puedes{" "}
              <button
                type="button"
                className="text-purple-300 underline underline-offset-2 hover:text-white"
                onClick={() => window.location.reload()}
              >
                recargar la página
              </button>{" "}
              (el indicador se resetea; si el servidor siguió trabajando, verás datos nuevos al cargar).
            </>
          ) : null}
        </p>
      ) : null}

      {state && !pending ? <ResultBanner state={state} /> : null}
    </div>
  );
}

function ResultBanner({ state }: { state: RefreshAccountsState }) {
  const success =
    state.ok && state.updated > 0 && state.errors.length === 0;
  const partial =
    state.ok && state.updated > 0 && state.errors.length > 0;
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
