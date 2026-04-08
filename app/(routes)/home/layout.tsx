import type { ReactNode } from "react";

/** Server actions de /home (refresco Riot → SQLite) pueden tardar varios minutos con varias cuentas. */
export const maxDuration = 300;

export default function HomeLayout({ children }: { children: ReactNode }) {
  return children;
}
