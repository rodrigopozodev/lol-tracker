/** Brillos naranja suaves sobre fondo casi negro. */
export default function NeonOrbitBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0f0a08] via-[#0a0a0a] to-[#0a0a0a]" />
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "5px 5px",
        }}
      />

      <div
        className="animate-orbit-slow absolute -left-[14%] top-[8%] h-[62vmin] w-[62vmin] rounded-full blur-3xl opacity-[0.28]"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(234,88,12,0.35), transparent 42%, rgba(251,146,60,0.2) 68%, transparent)",
        }}
      />
      <div
        className="animate-orbit-slower absolute -right-[8%] top-[4%] h-[72vmin] w-[72vmin] rounded-full blur-3xl opacity-[0.22]"
        style={{
          background:
            "conic-gradient(from 200deg, rgba(234,88,12,0.28), transparent 45%, rgba(249,115,22,0.18) 72%, transparent)",
        }}
      />
      <div
        className="animate-orbit-slow absolute bottom-[-12%] right-[6%] h-[78vmin] w-[78vmin] rounded-full blur-3xl opacity-[0.2]"
        style={{
          background:
            "conic-gradient(from 90deg, rgba(251,146,60,0.25), transparent 38%, rgba(234,88,12,0.15) 62%, transparent)",
        }}
      />

      <div
        className="animate-pulse-glow absolute left-1/2 top-1/2 h-[100vmin] w-[100vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[72px] opacity-[0.14]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(234,88,12,0.2), rgba(234,88,12,0.05), transparent)",
        }}
      />
    </div>
  );
}
