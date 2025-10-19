export default function NeonOrbitBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* fondo base oscuro con pequeñas estrellas */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }} />
      </div>

      {/* órbita violeta izquierda */}
      <div className="animate-orbit-slow mix-blend-screen absolute -left-[12%] top-[12%] w-[65vmin] h-[65vmin] rounded-full blur-2xl" style={{
        backgroundImage:
          "conic-gradient(from 0deg, rgba(98,51,196,0.95), rgba(98,51,196,0) 30%, rgba(98,51,196,0.95) 55%, rgba(98,51,196,0) 80%, rgba(98,51,196,0.95))",
      }} />

      {/* órbita azul superior-derecha */}
      <div className="animate-orbit-slower mix-blend-screen absolute right-[-10%] top-[2%] w-[75vmin] h-[75vmin] rounded-full blur-xl opacity-90" style={{
        backgroundImage:
          "conic-gradient(from 180deg, rgba(14,165,233,0.9), rgba(14,165,233,0) 40%, rgba(14,165,233,0.9) 65%, rgba(14,165,233,0) 85%, rgba(14,165,233,0.9))",
      }} />

      {/* órbita naranja/magenta inferior-derecha */}
      <div className="animate-orbit-slow mix-blend-screen absolute right-[8%] bottom-[-14%] w-[85vmin] h-[85vmin] rounded-full blur-xl opacity-85" style={{
        backgroundImage:
          "conic-gradient(from 90deg, rgba(244,63,94,0.9), rgba(244,63,94,0) 35%, rgba(245,158,11,0.9) 60%, rgba(245,158,11,0) 85%, rgba(244,63,94,0.9))",
      }} />

      {/* halo tenue alrededor del centro */}
      <div className="animate-pulse-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vmin] h-[110vmin] rounded-full blur-[70px] opacity-20" style={{
        background:
          "radial-gradient(closest-side, rgba(99,102,241,0.35), rgba(99,102,241,0.08), transparent)"
      }} />
    </div>
  );
}