import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="relative z-20 border-b-4 border-primary bg-[#111111] shadow-md shadow-black/40">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="League Tracker - Inicio">
          <Image src="/LoL-Tracker.png" alt="" width={48} height={48} className="rounded-lg ring-2 ring-primary/50" />
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            League <span className="text-primary">Tracker</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition hover:bg-white/5 hover:text-primary"
        >
          Buscar invocador
        </Link>
      </nav>
    </header>
  );
}
