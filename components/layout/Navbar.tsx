import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="p-4 bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto flex gap-6 items-center">
        {/* Logo a la izquierda */}
        <Link href="/" aria-label="League Tracker" className="flex items-center">
          <Image src="/LoL-Tracker" alt="League Tracker" width={32} height={32} />
        </Link>
        {/* Links de navegación */}
        <Link href="/">Inicio</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/auth/login">Login</Link>
        <Link href="/auth/register">Registro</Link>
      </div>
    </nav>
  );
}
