import { redirect } from "next/navigation";

export default function RootPage() {
  // Iniciar en la página principal del proyecto
  redirect("/home");
}
