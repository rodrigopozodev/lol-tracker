import { refreshAllAccountsFromRiot } from "@/lib/refreshAccounts";

export type HomeRefreshPhase = "idle" | "running" | "finished";

export type HomeRefreshJobSnapshot =
  | { phase: "idle" }
  | { phase: "running"; startedAt: number }
  | {
      phase: "finished";
      startedAt: number;
      finishedAt: number;
      result: { ok: boolean; updated: number; errors: string[] };
    };

let job: HomeRefreshJobSnapshot = { phase: "idle" };

export function getHomeRefreshJob(): HomeRefreshJobSnapshot {
  return job;
}

/**
 * Arranca el refresco en segundo plano (no bloquea la respuesta HTTP).
 * Evita timeouts de proxy (p. ej. Cloudflare ~100s) frente a server actions largas.
 */
export function startHomeRefreshJob(): { accepted: true; alreadyRunning: boolean } {
  if (job.phase === "running") {
    return { accepted: true, alreadyRunning: true };
  }
  if (job.phase === "finished") {
    job = { phase: "idle" };
  }

  const startedAt = Date.now();
  job = { phase: "running", startedAt };

  void refreshAllAccountsFromRiot()
    .then((result) => {
      job = {
        phase: "finished",
        startedAt,
        finishedAt: Date.now(),
        result: {
          ok: result.ok,
          updated: result.updated,
          errors: result.errors,
        },
      };
    })
    .catch((e: unknown) => {
      job = {
        phase: "finished",
        startedAt,
        finishedAt: Date.now(),
        result: {
          ok: false,
          updated: 0,
          errors: [e instanceof Error ? e.message : String(e)],
        },
      };
    });

  return { accepted: true, alreadyRunning: false };
}
