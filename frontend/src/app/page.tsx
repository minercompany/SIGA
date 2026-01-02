import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirigimos al dashboard para que el layout privado maneje la sesión.
  // Si no hay token, el layout privado redirigirá al login.
  redirect("/dashboard");
}
