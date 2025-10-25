"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, AlertCircle } from "lucide-react"; // 👈 iconos SVG

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [gameNameTouched, setGameNameTouched] = useState(false);
  const [tagLineTouched, setTagLineTouched] = useState(false);

  // Derivados de validación
  const emailEmpty = email.trim().length === 0;
  const emailFormatInvalid = !emailEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordEmpty = password.trim().length === 0;
  const passwordComplexInvalid = !passwordEmpty && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
  const confirmEmpty = confirmPassword.trim().length === 0;
  const passwordMismatch = !confirmEmpty && password !== confirmPassword;
  const gameNameEmpty = gameName.trim().length === 0;
  const gameNameInvalid = !gameNameEmpty && gameName.includes(" ");
  const tagLineEmpty = tagLine.trim().length === 0;
  const tagLineFormatInvalid = !tagLineEmpty && (/\s/.test(tagLine) || tagLine.length > 3);

  const formHasErrors = (
    emailEmpty || emailFormatInvalid ||
    passwordEmpty || passwordComplexInvalid || confirmEmpty || passwordMismatch ||
    gameNameEmpty || gameNameInvalid ||
    tagLineEmpty || tagLineFormatInvalid
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Bloquear envío si hay cualquier error
    if (formHasErrors) {
      setEmailTouched(true);
      setPasswordTouched(true);
      setConfirmTouched(true);
      setGameNameTouched(true);
      setTagLineTouched(true);
      setLoading(false);
      return;
    }

    // Validación: GameName sin espacios
    if (gameName.includes(" ")) {
      setLoading(false);
      setError("El nombre de la cuenta (GameName) debe introducirse sin espacios.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, phone: phone || null, gameName, tagLine }),
      });

      const json = await res.json();
      if (!res.ok) setError(json.error || "Error de registro");
      else {
        setSuccess("Te hemos enviado un correo para verificar tu cuenta. Revisa tu bandeja de entrada.");
        // No redirigimos automáticamente para que el usuario vea el mensaje.
      }
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-sm mx-auto">
      {/* Logo */}
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
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-form-label">Correo electrónico</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          placeholder="tú@email.com"
          aria-invalid={emailTouched && (emailEmpty || emailFormatInvalid) || undefined}
          aria-describedby={emailTouched && (emailEmpty || emailFormatInvalid) ? "email-error" : undefined}
          className={`h-12 px-4 bg-form-input border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none transition ${emailTouched && (emailEmpty || emailFormatInvalid) ? "border-red-500 focus-visible:ring-2 focus-visible:ring-red-500" : "border-form-border focus-visible:ring-2 focus-visible:ring-form-ring"}`}
        />
        {emailTouched && emailEmpty && (
          <p id="email-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Falta el correo electrónico.
          </p>
        )}
        {emailTouched && !emailEmpty && emailFormatInvalid && (
          <p id="email-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Formato de correo inválido.
          </p>
        )}
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
            onBlur={() => setPasswordTouched(true)}
            placeholder="••••••••"
            aria-invalid={passwordTouched && (passwordEmpty || passwordComplexInvalid) || undefined}
            aria-describedby={passwordTouched && (passwordEmpty || passwordComplexInvalid) ? "password-error" : undefined}
            className={`h-12 px-4 pr-12 bg-form-input border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none transition ${passwordTouched && (passwordEmpty || passwordComplexInvalid) ? "border-red-500 focus-visible:ring-2 focus-visible:ring-red-500" : "border-form-border focus-visible:ring-2 focus-visible:ring-form-ring"}`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {passwordTouched && passwordEmpty && (
          <p id="password-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Falta la contraseña.
          </p>
        )}
        {passwordTouched && !passwordEmpty && passwordComplexInvalid && (
          <p id="password-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Debe tener 8+ caracteres con letras y números.
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm text-form-label">Confirmar contraseña</label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            placeholder="••••••••"
            aria-invalid={confirmTouched && (confirmEmpty || passwordMismatch) || undefined}
            aria-describedby={confirmTouched && (confirmEmpty || passwordMismatch) ? "confirm-error" : undefined}
            className={`h-12 px-4 pr-12 bg-form-input border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none transition ${confirmTouched && (confirmEmpty || passwordMismatch) ? "border-red-500 focus-visible:ring-2 focus-visible:ring-red-500" : "border-form-border focus-visible:ring-2 focus-visible:ring-form-ring"}`}
          />
          <button
            type="button"
            aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {confirmTouched && confirmEmpty && (
          <p id="confirm-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Falta confirmar la contraseña.
          </p>
        )}
        {confirmTouched && !confirmEmpty && passwordMismatch && (
          <p id="confirm-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={14} /> Las contraseñas no coinciden.
          </p>
        )}
      </div>

      {/* Riot ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="gameName" className="text-sm text-form-label">Riot ID: GameName</label>
          <input
            id="gameName"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            onBlur={() => setGameNameTouched(true)}
            placeholder="Ej. Degryh"
            aria-invalid={(gameNameTouched && gameNameEmpty) || (!gameNameEmpty && gameNameInvalid) || undefined}
            aria-describedby={(gameNameTouched && gameNameEmpty) || (!gameNameEmpty && gameNameInvalid) ? "game-name-error" : undefined}
            className={`h-12 px-4 bg-form-input border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none transition ${((gameNameTouched && gameNameEmpty) || (!gameNameEmpty && gameNameInvalid)) ? "border-red-500 focus-visible:ring-2 focus-visible:ring-red-500" : "border-form-border focus-visible:ring-2 focus-visible:ring-form-ring"}`}
          />
        {gameNameTouched && gameNameEmpty && (
            <p id="game-name-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> Falta GameName.
            </p>
          )}
          {!gameNameEmpty && gameNameInvalid && (
            <p id="game-name-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> No se permiten espacios en el Riot ID.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="tagLine" className="text-sm text-form-label">Riot ID: TagLine</label>
          <input
            id="tagLine"
            value={tagLine}
            onChange={(e) => setTagLine(e.target.value)}
            onBlur={() => setTagLineTouched(true)}
            placeholder="Ej. EUW"
            aria-invalid={(tagLineTouched && tagLineEmpty) || (!tagLineEmpty && tagLineFormatInvalid) || undefined}
            aria-describedby={(tagLineTouched && tagLineEmpty) || (!tagLineEmpty && tagLineFormatInvalid) ? "tagline-error" : undefined}
            className={`h-12 px-4 bg-form-input border rounded-md w-full text-form-foreground placeholder:text-form-placeholder focus-visible:outline-none transition ${((tagLineTouched && tagLineEmpty) || (!tagLineEmpty && tagLineFormatInvalid)) ? "border-red-500 focus-visible:ring-2 focus-visible:ring-red-500" : "border-form-border focus-visible:ring-2 focus-visible:ring-form-ring"}`}
          />
          {tagLineTouched && tagLineEmpty && (
            <p id="tagline-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> Falta TagLine.
            </p>
          )}
          {!tagLineEmpty && tagLineFormatInvalid && (
            <p id="tagline-error" role="alert" aria-live="polite" className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> El TagLine debe tener entre 3 caracteres.
            </p>
          )}
        </div>
      </div>

      {/* Botón Crear cuenta */}
      <Button
        type="submit"
        disabled={loading || formHasErrors}
        className="w-full h-12 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold text-base uppercase tracking-wider rounded-full hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95 transition-all duration-300"
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </Button
      >

      {error && <p className="text-destructive text-sm" role="alert" aria-live="polite">{error}</p>}
      {success && (
        <div className="bg-green-100 text-green-800 border border-green-300 rounded-lg p-4" role="alert" aria-live="polite">
          {success}
        </div>
      )}

      {/* Texto + botón centrados */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-[color:var(--color-form-placeholder)] text-sm">¿Ya tienes cuenta?</span>
        <Button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="h-11 px-4 bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-semibold rounded-full transition-all duration-300 hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95"
        >
          Iniciar sesión
        </Button>
      </div>
    </form>
  );
};

export default RegisterForm;
