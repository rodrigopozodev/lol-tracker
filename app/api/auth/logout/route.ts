import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logout correcto" });
  // Eliminar cookie de sesión propia
  res.cookies.delete("session");
  return res;
}

export async function GET() {
  // Permitir también GET para compatibilidad
  const res = NextResponse.json({ message: "Logout correcto" });
  res.cookies.delete("session");
  return res;
}