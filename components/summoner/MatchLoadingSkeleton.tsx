export default function MatchLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8" aria-busy="true" aria-label="Cargando partida">
      <div className="mb-6 h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="mb-6 h-24 animate-pulse rounded-xl border border-border bg-card/70" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/80" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
