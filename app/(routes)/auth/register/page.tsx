import AuthPageLayout from "@/components/layout/AuthPageLayout";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthPageLayout title="Crear cuenta">
      <RegisterForm />
    </AuthPageLayout>
  );
}
