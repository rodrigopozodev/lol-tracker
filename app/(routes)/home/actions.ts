"use server";

import { revalidatePath } from "next/cache";
import { refreshAllAccountsFromRiot } from "@/lib/refreshAccounts";

export type RefreshAccountsState = {
  ok: boolean;
  updated: number;
  errors: string[];
  message: string;
};

export async function refreshAccountsAction(
  _prev: RefreshAccountsState | null,
  _formData: FormData
): Promise<RefreshAccountsState> {
  const result = await refreshAllAccountsFromRiot();
  revalidatePath("/home");

  if (!result.ok) {
    return {
      ok: false,
      updated: 0,
      errors: result.errors,
      message:
        result.errors[0] ||
        "No se pudo refrescar. Comprueba RIOT_API_KEY y que la base de datos sea accesible.",
    };
  }

  const errSuffix =
    result.errors.length > 0
      ? ` · Avisos: ${result.errors.length} (revisa la lista debajo).`
      : "";

  const message =
    result.updated === 0
      ? result.errors.length > 0
        ? `No se pudo actualizar ninguna cuenta.${errSuffix}`
        : "No se actualizó ninguna cuenta (¿sin cuentas o sin API key?)."
      : `Listo: ${result.updated} cuenta(s) guardadas en SQLite y en data/accounts-snapshot.json.${errSuffix}`;

  return {
    ok: true,
    updated: result.updated,
    errors: result.errors,
    message,
  };
}
