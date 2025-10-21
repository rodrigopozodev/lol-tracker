"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone: phone || null, gameName, tagLine }),
      });

      let payload: any = null;
      let text: string | null = null;
      try { payload = await res.json(); } catch { try { text = await res.text(); } catch {} }

      if (!res.ok) {
        const msg = (payload && payload.error) || text || `Error de registro (${res.status})`;
        setError(msg);
      } else {
        const msg = (payload && payload.message) || text || "Registro creado. Verifica tu teléfono por SMS.";
        setSuccess(msg);
        try {
          if (payload?.user_id) sessionStorage.setItem("register_user_id", String(payload.user_id));
          if (email) sessionStorage.setItem("register_email", email);
          if (password) sessionStorage.setItem("register_password", password);
          if (payload?.dev_phone_code) sessionStorage.setItem("register_dev_phone_code", String(payload.dev_phone_code));
        } catch {}
        router.push("/auth/verify-phone");
      }
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm mx-auto">
      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-form-label">Correo electrónico</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tú@email.com"
          className="h-12 px-4 bg-form-input border border-form-border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring focus-visible:border-form-border transition"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm text-form-label">Contraseña</label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 px-4 pr-12 bg-form-input border border-form-border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring focus-visible:border-form-border transition"
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-1 my-1 px-3 rounded-md text-xs font-medium bg-transparent text-form-label hover:text-form-foreground hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm text-form-label">Teléfono (opcional)</label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej. +346XXXXXXXX"
          className="h-12 px-4 bg-form-input border border-form-border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring focus-visible:border-form-border transition"
        />
        <p className="text-xs text-form-label">Usado para verificación por SMS (si lo habilitas).</p>
      </div>

      {/* Riot ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="gameName" className="text-sm text-form-label">Riot ID: GameName</label>
          <input
            id="gameName"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Tu nombre de invocador"
            className="h-12 px-4 bg-form-input border border-form-border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring focus-visible:border-form-border transition"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="tagLine" className="text-sm text-form-label">Riot ID: TagLine</label>
          <input
            id="tagLine"
            value={tagLine}
            onChange={(e) => setTagLine(e.target.value)}
            placeholder="Ej. EUW"
            className="h-12 px-4 bg-form-input border border-form-border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-form-ring focus-visible:border-form-border transition"
          />
        </div>
      </div>

      {/* Botón Crear cuenta */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-base uppercase tracking-wider rounded-full hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95 transition-all duration-300"
      >
        {loading ? "Creando..." : "Crear cuenta"}
      </Button>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}


{/* Texto + botón centrados */}
<div className="flex items-center justify-center gap-2 pt-2">
  <span className="text-[color:var(--color-form-placeholder)] text-sm">¿Ya tienes cuenta?</span>
  <Button
    type="button"
    onClick={() => router.push("/auth/login")}
    className="h-11 px-4 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-semibold rounded-full hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95 transition-all duration-300"
  >
    Iniciar sesión
  </Button>
</div>


    </form>
  );
};

export default RegisterForm;
