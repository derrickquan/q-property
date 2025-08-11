// pages/login.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ensureDefaultUser, signIn } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureDefaultUser();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      setBusy(true);
      await signIn(email, pw);
      window.location.href = "/properties";
    } catch (e: any) {
      setErr(e?.message || "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <Link className="text-sm text-blue-600 hover:underline" href="/start">
              Create a new account
            </Link>
          </div>
        </form>

        <div className="mt-6 p-3 rounded border border-slate-200 bg-slate-50 text-xs text-slate-600">
          Demo account: <code>JohnSmith@gmail.com</code> / <code>123</code>
        </div>
      </div>
    </main>
  );
}
