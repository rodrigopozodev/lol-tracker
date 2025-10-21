"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

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
    <form onSubmit={submit} className="max-w-sm mx-auto space-y-3">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border p-2 w-full rounded"
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full pr-16 rounded"
          aria-label="Contraseña"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-gray-800/40 hover:bg-gray-800/60 text-gray-100"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      {/* Botón centrado con estilo unificado al botón "Crear cuenta" */}
      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-base uppercase tracking-wider rounded-full hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95 transition-all duration-300"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {riot && (
        <div className="text-sm mt-2">
          <p>Invocador: {riot?.name ?? "-"}</p>
          <p>Nivel: {riot?.level ?? "-"}</p>
          <p>Región: {riot?.region ?? "-"}</p>
        </div>
      )}
    </form>
  );
};

export default LoginForm;
