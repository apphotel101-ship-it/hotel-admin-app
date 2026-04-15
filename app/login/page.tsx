"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/auth/api";
import { useAuth } from "@/context/auth-context";
import { PublicOnlyRoute } from "@/components/auth/public-only-route";

type FormValues = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
}

export default function LoginPage() {
  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login(values.email.trim(), values.password);
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ form: error.message || "Invalid credentials. Please try again." });
      } else {
        setErrors({ form: "Something went wrong. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicOnlyRoute>
      <main className="login-page">
        <section className="login-card">
          <h1>Hotel Admin Login</h1>
          <p>Sign in to access the admin dashboard.</p>

          <form className="login-form" onSubmit={onSubmit} noValidate>
            <label className="login-field">
              <span>Email</span>
              <input
                type="email"
                value={values.email}
                onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="admin@hotel.com"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <small className="field-error">{errors.email}</small> : null}
            </label>

            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                value={values.password}
                onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <small className="field-error">{errors.password}</small> : null}
            </label>

            {errors.form ? <div className="form-error">{errors.form}</div> : null}

            <button type="submit" className="login-button" disabled={!canSubmit}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </section>
      </main>
    </PublicOnlyRoute>
  );
}
