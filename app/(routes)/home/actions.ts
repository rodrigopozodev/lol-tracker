"use server";

import { revalidatePath } from "next/cache";
import { refreshAllAccountsFromRiot } from "@/lib/refreshAccounts";
import {
  toRefreshAccountsState,
  type RefreshAccountsState,
} from "@/lib/refreshAccountsUiMessage";

export type { RefreshAccountsState } from "@/lib/refreshAccountsUiMessage";

/** Refresco síncrono (p. ej. tests); en la UI usa `/api/home/account-refresh` para evitar timeouts de proxy. */
export async function refreshAccountsAction(
  _prev: RefreshAccountsState | null,
  _formData: FormData
): Promise<RefreshAccountsState> {
  const result = await refreshAllAccountsFromRiot();
  revalidatePath("/home");
  return toRefreshAccountsState(result);
}
