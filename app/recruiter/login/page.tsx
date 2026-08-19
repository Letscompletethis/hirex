"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function RecruiterLoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();


setError("");
setLoading(true);

try {
  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (loginError) {
    setError(loginError.message);
    return;
  }

  router.push("/recruiter");
  router.refresh();
} catch (error) {
  console.error("Recruiter login error:", error);
  setError("Something went wrong. Please try again.");
} finally {
  setLoading(false);
}


}

return ( <main className="min-h-screen bg-[#03040a] text-white"> <div className="flex min-h-screen items-center justify-center px-5 py-10"> <div className="w-full max-w-md">


      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/10">
          <span className="text-lg font-bold text-purple-200">
            HX
          </span>
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/70">
          HireX ATS
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Recruiter Login
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Sign in to access your recruiting dashboard.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl sm:p-8"
      >
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-xs font-medium text-white/55"
          >
            Email
          </label>

          <div className="relative">
            <Mail
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="recruiter@hirex.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40 focus:bg-white/[0.04]"
            />
          </div>
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
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40 focus:bg-white/[0.04]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
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

        <p className="mt-6 text-center text-xs text-white/25">
          Authorized HireX recruiters only.
        </p>
      </form>

      <div className="mt-6 text-center">
        <a
          href="/"
          className="text-xs text-white/35 transition hover:text-white/70"
        >
          ← Back to HireX
        </a>
      </div>

    </div>
  </div>
</main>


);
}