"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import AuthPageLayout from "@/components/layout/AuthPageLayout";

export default function VerifyPhonePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>("Introduce el código SMS para verificar tu teléfono y entrar.");

  useEffect(() => {
    try {
      const uid = sessionStorage.getItem("register_user_id");
      const em = sessionStorage.getItem("register_email");
      const pw = sessionStorage.getItem("register_password");
      const devCode = sessionStorage.getItem("register_dev_phone_code");
      setUserId(uid && uid !== "null" && uid !== "undefined" ? uid : null);
      setEmail(em);
      setPassword(pw);
      if (devCode) setCode(devCode);
    } catch {}
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!userId && !email) {
        setError("No hay registro en curso. Vuelve a crear la cuenta.");
        return;
      }
      const res = await fetch("/api/auth/verify/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, email, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Error verificando el teléfono");
      } else {
        // Login automático si guardamos las credenciales del registro
        if (email && password) {
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const loginJson = await loginRes.json();
          if (!loginRes.ok) {
            setError(loginJson?.error || "Verificado, pero no pudimos iniciar sesión");
          } else {
            // Limpieza y redirección
            try {
              sessionStorage.removeItem("register_user_id");
              sessionStorage.removeItem("register_email");
              sessionStorage.removeItem("register_password");
              sessionStorage.removeItem("register_dev_phone_code");
            } catch {}
            router.push("/dashboard");
          }
        } else {
          // Si no tenemos las credenciales, llevar al login
          router.push("/auth/login");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };





  return (
    <AuthPageLayout title="Verificar teléfono" subtitle={info || undefined}>
      <form onSubmit={verify} className="space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código SMS de 6 dígitos"
          className="w-full rounded-md bg-[color:var(--color-form-input)]/80 border border-[color:var(--color-form-border)]/40 p-2 text-[color:var(--color-form-foreground)] placeholder:text-[color:var(--color-form-placeholder)]"
        />
        <Button type="submit" disabled={loading || !code}>
          {loading ? "Verificando..." : "Verificar y entrar"}
        </Button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>
    </AuthPageLayout>
  );
}