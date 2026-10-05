import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-semibold " +
  "transition-[background-color,color,box-shadow,opacity] duration-200 motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-sm hover:bg-accent-hover",
  secondary: "border-2 border-primary bg-card text-heading hover:bg-primary-soft",
  ghost: "text-muted-foreground hover:bg-primary-soft hover:text-heading",
};

export function Button({
  variant = "primary",
  loading = false,
  loadingText,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
