import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { LoginForm } from "@/components/forms/LoginForm";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <AuthPageLayout title="Iniciar sesión">
      <LoginForm />
      <div className="mt-4 flex items-center justify-between text-xs sm:text-sm">
        <span className="text-[color:var(--color-form-placeholder)]">¿No tienes cuenta?</span>
        <Link href="/auth/register" aria-label="Ir a registro">
          <Button variant="secondary">Crear cuenta</Button>
        </Link>
      </div>
    </AuthPageLayout>
  );
}
