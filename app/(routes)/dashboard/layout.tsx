import DashboardLines from "@/components/DashboardLines";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <DashboardLines />
      </div>
      <section className="relative z-10 mx-auto w-full max-w-6xl px-3 sm:px-6 py-6">
        <h1 className="sr-only">Dashboard</h1>
        <div className="grid gap-6">
          {children}
        </div>
      </section>
    </main>
  );
}
