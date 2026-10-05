import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Dashboard } from "@/components/Dashboard";
import { getUserFromCookies } from "@/lib/auth/currentUser";
import { listUploadsByUser } from "@/lib/repositories/uploads";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  const rows = await listUploadsByUser(user.userId);
  const uploads = rows.map((row) => ({
    id: row.id,
    imageUrl: row.imageUrl,
    score: row.score,
    label: row.label,
    expressions: JSON.parse(row.expressions) as Record<string, number>,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <AppHeader email={user.email} />
      <main id="main" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">How big is your smile today?</h1>
        <Dashboard initialUploads={uploads} />
      </main>
    </>
  );
}
