import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...rest}
      className={`rounded-xl border border-border bg-card p-6 shadow-card ${className}`}
    />
  );
}
