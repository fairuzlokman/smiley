"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

type Mode = "login" | "register";
type FieldName = "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

const copy = {
  login: {
    title: "Welcome back",
    submit: "Log in",
    pending: "Logging in…",
    switchText: "New here?",
    switchLink: "Create an account",
    switchHref: "/register",
    passwordAutocomplete: "current-password",
  },
  register: {
    title: "Create your account",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: "Log in",
    switchHref: "/login",
    passwordAutocomplete: "new-password",
  },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const schema = mode === "login" ? loginSchema : registerSchema;
  const text = copy[mode];

  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  function validateField(name: FieldName, value: string): string | undefined {
    const result = schema.shape[name].safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  }

  function handleBlur(name: FieldName) {
    // Validate on blur, not on every keystroke, so people aren't shouted at mid-typing.
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, values[name]) }));
  }

  function focusFirstInvalid(errors: FieldErrors) {
    if (errors.email) emailRef.current?.focus();
    else if (errors.password) passwordRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      focusFirstInvalid(errors);
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const body = await res.json().catch(() => ({}));
      if (res.status === 400 && body.details?.fieldErrors) {
        setFieldErrors(body.details.fieldErrors);
        focusFirstInvalid(body.details.fieldErrors);
      } else {
        setFormError(body.error ?? "Something went wrong. Please try again.");
        // Move focus to the summary so keyboard and screen-reader users hear it.
        requestAnimationFrame(() => alertRef.current?.focus());
      }
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{text.title}</h1>

      {formError && (
        <div ref={alertRef} tabIndex={-1} className="focus:outline-none">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}

      <Field
        ref={emailRef}
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        value={values.email}
        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        onBlur={() => handleBlur("email")}
        error={fieldErrors.email}
      />

      <Field
        ref={passwordRef}
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        autoComplete={text.passwordAutocomplete}
        required
        hint={mode === "register" ? "At least 8 characters." : undefined}
        value={values.password}
        onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        onBlur={() => handleBlur("password")}
        error={fieldErrors.password}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:text-heading motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        }
      />

      <Button type="submit" loading={pending} loadingText={text.pending} className="mt-1 w-full">
        {text.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {text.switchText}{" "}
        <Link
          href={text.switchHref}
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          {text.switchLink}
        </Link>
      </p>
    </form>
  );
}
