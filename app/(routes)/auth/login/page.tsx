import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { LoginForm } from "@/components/forms/LoginForm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <AuthPageLayout title="Iniciar sesión">
      <LoginForm />

      {/* Contenedor compacto para "No tienes cuenta / Crear cuenta" */}
      <div className="mt-4 flex justify-center items-center text-xs sm:text-sm gap-2">
        <span className="text-[color:var(--color-form-placeholder)]">
          ¿No tienes cuenta?
        </span>
        <Link href="/auth/register" aria-label="Ir a registro">
          <Button
            type="button"
            className="h-12 px-5 bg-gradient-to-r from-cyan-400 to-blue-600 
            text-white text-sm font-semibold rounded-full 
            transition-all duration-300 
            hover:from-form-gradient-from hover:to-form-gradient-to hover:opacity-95"
          >
            Crear cuenta
          </Button>
        </Link>
      </div>
    </AuthPageLayout>
  );
}
