import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="p-4 bg-white border-b shadow-sm">
      <div className="max-w-5xl mx-auto flex gap-6">
        <Link href="/">Inicio</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/auth/login">Login</Link>
        <Link href="/auth/register">Registro</Link>
        <Link href="/settings">Settings</Link>
      </div>
    </nav>
  );
}
