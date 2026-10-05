import { redirect } from "next/navigation";
import { getUserFromCookies } from "@/lib/auth/currentUser";

export default async function HomePage() {
  const user = await getUserFromCookies();
  redirect(user ? "/dashboard" : "/login");
}
