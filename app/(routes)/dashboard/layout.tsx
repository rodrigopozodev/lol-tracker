export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <section className="relative z-10 mx-auto w-full max-w-none px-4 py-6 sm:px-8 lg:px-12">
        <h1 className="sr-only">Dashboard</h1>
        <div className="grid gap-6">
          {children}
        </div>
      </section>
    </main>
  );
}
