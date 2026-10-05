import { Smile } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex min-h-11 items-center gap-2 rounded-lg font-heading text-lg text-heading">
          <Smile className="size-6 text-primary" aria-hidden="true" />
          Smile Score
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-muted-foreground sm:inline" title={email}>
            {email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
