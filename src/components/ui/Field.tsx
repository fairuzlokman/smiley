import type { InputHTMLAttributes, ReactNode, Ref } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  ref?: Ref<HTMLInputElement>;
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Rendered inside the input wrapper, e.g. a show/hide password toggle. */
  trailing?: ReactNode;
};

/**
 * Label + input + hint/error wired together with aria-describedby so screen
 * readers announce the error with the field, not just a red border.
 */
export function Field({ ref, id, label, error, hint, trailing, className = "", ...input }: Props) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {input.required && (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={
            "h-11 w-full rounded-lg border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground " +
            "transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none " +
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background " +
            (error ? "border-destructive " : "border-border ") +
            (trailing ? "pr-12 " : "") +
            className
          }
          {...input}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
