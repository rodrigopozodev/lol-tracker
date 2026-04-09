/** Placeholders durante la carga; animación `pulse` viene de Tailwind. */
export default function ProfileLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8" aria-busy="true" aria-label="Cargando perfil">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-muted sm:mx-0 sm:w-64" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted/70 sm:mx-0" />
          </div>
        </div>
        <div className="mt-8 flex justify-center gap-3 border-t border-border pt-8">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="mx-auto mt-6 h-24 w-24 animate-pulse rounded-lg bg-muted/70" />
      </div>
      <div className="mt-10 space-y-2">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/80" />
        ))}
      </div>
    </div>
  );
}
