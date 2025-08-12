import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, getUser, ensureDefaultUser } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("JohnSmith@gmail.com"); // demo default
  const [password, setPassword] = useState("123");            // demo default
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureDefaultUser(); // ensure the demo user exists
    if (getUser()) router.replace("/properties");
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = signIn(email.trim(), password);
      if (res.ok) {
        router.push("/properties"); // NavBar updates via auth event
      } else {
        setError(res.error || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 shadow-sm p-6 bg-white">
        <h1 className="text-xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-slate-600 mb-4">
          Demo: <span className="font-medium">JohnSmith@gmail.com</span> / <span className="font-medium">123</span>
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-blue-600 text-white py-2 hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="text-sm text-slate-600 mt-4">
          Don’t have an account?{" "}
          <Link href="/start" className="text-blue-600 hover:underline">
            Start free
          </Link>
        </div>
      </div>
    </main>
  );
}
