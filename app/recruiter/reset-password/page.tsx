"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Loader2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmation, setConfirmation] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (
          authError ||
          !user
        ) {
          await supabase.auth.signOut();
          router.replace("/recruiter/login");
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "status,must_change_password"
          )
          .eq("id", user.id)
          .single();

        if (
          profileError ||
          !profile ||
          profile.status !== "active"
        ) {
          await supabase.auth.signOut();
          router.replace("/recruiter/login");
          return;
        }

        if (
          profile.must_change_password !==
          true
        ) {
          router.replace("/recruiter");
          return;
        }
      } catch (caughtError) {
        console.error(
          "Reset password session check error:",
          caughtError
        );

        await supabase.auth.signOut();
        router.replace("/recruiter/login");
      } finally {
        setCheckingSession(false);
      }
    }

    void checkSession();
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Your password must be at least 8 characters long."
      );
      return;
    }

    if (password !== confirmation) {
      setError(
        "Your passwords do not match."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "/api/recruiter/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to change your password."
        );
      }

      /*
       * The server has now:
       *
       * 1. Changed the Supabase Auth password.
       * 2. Changed must_change_password
       *    from true to false.
       */

      await supabase.auth.signOut();

      router.replace(
        "/recruiter/login?passwordChanged=true"
      );

      router.refresh();
    } catch (caughtError) {
      console.error(
        "Reset password error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to set your password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#03040a] text-white">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Checking your account...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#03040a] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl">
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/[0.08]">
            <KeyRound
              size={22}
              className="text-purple-300"
            />
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-300/60">
            HireX ATS
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Set your password
          </h1>

          <p className="mt-2 text-sm leading-6 text-white/40">
            Your administrator created your
            account with a temporary password.
            Choose your own password to
            continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-medium text-white/55"
            >
              New password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Create your password"
              disabled={saving}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40"
            />
          </div>

          <div>
            <label
              htmlFor="confirmation"
              className="mb-2 block text-xs font-medium text-white/55"
            >
              Confirm new password
            </label>

            <input
              id="confirmation"
              type="password"
              value={confirmation}
              onChange={(event) =>
                setConfirmation(
                  event.target.value
                )
              }
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Confirm your password"
              disabled={saving}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40"
            />
          </div>

          <p className="text-xs leading-5 text-white/30">
            Your password must be at least 8
            characters long.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Saving password...
              </>
            ) : (
              "Set Password"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}