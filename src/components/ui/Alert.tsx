import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  tone: "error" | "success";
  children: ReactNode;
  /** Set a `ref` target id so forms can move focus here after a failed submit. */
  id?: string;
};

export function Alert({ tone, children, id }: Props) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  const styles =
    tone === "error"
      ? "border-destructive/40 bg-destructive-soft text-destructive"
      : "border-success/40 bg-success-soft text-success";
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : "status"}
      tabIndex={-1}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${styles}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
