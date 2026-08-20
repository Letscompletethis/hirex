"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function RecruiterLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        setError(
          loginError.message ===
            "Invalid login credentials"
            ? "Invalid email or password."
            : loginError.message
        );
        return;
      }

      if (!data.user) {
        setError(
          "Unable to sign in. Please try again."
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "role,status,must_change_password"
        )
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setError(
          "Your HireX profile could not be found."
        );

        return;
      }

      if (profile.status !== "active") {
        await supabase.auth.signOut();

        setError(
          "Your HireX account is inactive. Please contact an administrator."
        );

        return;
      }

      if (
        profile.must_change_password === true
      ) {
        router.replace(
          "/recruiter/reset-password"
        );
        router.refresh();

        return;
      }

      router.replace("/recruiter");
      router.refresh();
    } catch (caughtError) {
      console.error(
        "Recruiter login error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    const cleanEmail = email
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      setError(
        "Enter your email address first."
      );
      return;
    }

    setForgotLoading(true);

    try {
      const redirectTo =
        `${window.location.origin}` +
        "/recruiter/reset-password";

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "If an account exists for this email, a password reset email has been sent. Check your inbox."
      );
    } catch (caughtError) {
      console.error(
        "Forgot password error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send the password reset email."
      );
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#03040a] px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.025] p-7 shadow-2xl sm:p-9">

          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-300/60">
              HireX ATS
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Recruiter Sign In
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Sign in to your HireX recruiter account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <label
              htmlFor="email"
              className="mb-2 block text-xs font-medium text-white/55"
            >
              Email
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@hirex.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40 focus:bg-white/[0.04]"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-white/55"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40 focus:bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-xs font-medium text-purple-300/70 transition hover:text-purple-200 disabled:opacity-50"
              >
                {forgotLoading
                  ? "Sending..."
                  : "Forgot password?"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

          </form>
        </section>
      </div>
    </main>
  );
}