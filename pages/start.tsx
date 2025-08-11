// pages/start.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ensureDefaultUser, signUp } from "../lib/auth";

export default function StartPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // make sure JohnSmith default exists
    ensureDefaultUser();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (pw !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    try {
      setBusy(true);
      await signUp(email, pw);
      setOk("Account created! Redirecting to Properties…");
      // tiny delay so user sees the message
      setTimeout(() => {
        window.location.href = "/properties";
      }, 800);
    } catch (e: any) {
      setErr(e?.message || "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div>
              <label className="block text-sm font-medium">Confirm password</label>
              <input
                type="password"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          {err && <div className="text-sm text-red-600">{err}</div>}
          {ok && <div className="text-sm text-green-700">{ok}</div>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create account"}
            </button>
            <Link className="text-sm text-blue-600 hover:underline" href="/login">
              I already have an account
            </Link>
          </div>
        </form>

        <div className="mt-6 p-3 rounded border border-slate-200 bg-slate-50 text-xs text-slate-600">
          <div className="font-medium mb-1">Demo account (preloaded):</div>
          <div>Email: <code>JohnSmith@gmail.com</code></div>
          <div>Password: <code>123</code></div>
        </div>
      </div>
    </main>
  );
}
