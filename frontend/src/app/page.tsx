import { redirect } from "next/navigation";

export default function RootPage() {
  // Ahora redirigimos al login, si hay sesión el layout privado se encargará
  redirect("/login");
}
