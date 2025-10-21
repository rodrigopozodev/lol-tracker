"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riot, setRiot] = useState<any | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setRiot(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error de login");
      } else {
        router.replace("/home");
      }
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor padre con z-index alto para que todo el contenido esté por encima del fondo
    <div className="relative z-10">
      <form onSubmit={submit} className="max-w-sm mx-auto space-y-4">
        {/* Logo centrado */}
        <div className="flex justify-center mb-4">
          <Image
            src="/LoL-Tracker.png"
            alt="Logo LoL Tracker"
            width={120}
            height={120}
            className="rounded-lg"
            priority
          />
        </div>

        {/* Email */}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="border p-3 w-full rounded-md bg-form-input border-form-border text-form-foreground placeholder:text-form-placeholder focus:outline-none focus:ring-2 focus:ring-form-ring transition"
        />

        {/* Contraseña con icono */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="border p-3 w-full pr-12 rounded-md bg-form-input border-form-border text-form-foreground placeholder:text-form-placeholder focus:outline-none focus:ring-2 focus:ring-form-ring transition"
            aria-label="Contraseña"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Botón de iniciar sesión */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-base uppercase tracking-wider rounded-full hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95 transition-all duration-300"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </div>

        {/* Error */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {/* Información Riot */}
        {riot && (
          <div className="text-sm mt-2 text-center">
            <p>Invocador: {riot?.name ?? "-"}</p>
            <p>Nivel: {riot?.level ?? "-"}</p>
            <p>Región: {riot?.region ?? "-"}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
