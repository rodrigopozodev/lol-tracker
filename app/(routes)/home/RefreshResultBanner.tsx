"use client";

import type { RefreshAccountsState } from "@/lib/refreshAccountsUiMessage";

export function RefreshResultBanner({ state }: { state: RefreshAccountsState }) {
  const success = state.ok && state.updated > 0 && state.errors.length === 0;
  const partial = state.ok && state.updated > 0 && state.errors.length > 0;
  const failedAll = state.ok && state.updated === 0 && state.errors.length > 0;
  const neutralEmpty = state.ok && state.updated === 0 && state.errors.length === 0;
  const hardFail = !state.ok;

  const boxClass = hardFail
    ? "border-red-500/40 bg-red-500/10 text-red-100"
    : success
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
      : partial
        ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
        : failedAll
          ? "border-orange-500/55 bg-orange-950/40 text-orange-100"
          : neutralEmpty
            ? "border-amber-500/40 bg-amber-950/30 text-amber-100/95"
            : "border-red-500/40 bg-red-500/10 text-red-100";

  return (
    <div className={`rounded-lg border px-4 py-2.5 text-base ${boxClass}`} role="status">
      <p className="font-medium">{state.message}</p>
      {state.errors.length > 0 ? (
        <ul className="mt-2 max-h-64 list-inside list-disc overflow-y-auto text-sm opacity-95">
          {state.errors.map((e) => (
            <li key={e} className="break-words">
              {e}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
