import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signUp, getUser, ensureDefaultUser, signIn } from "../lib/auth";

export default function StartPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Smith");
  const [email, setEmail] = useState("JohnSmith@gmail.com");
  const [password, setPassword] = useState("123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureDefaultUser();
    if (getUser()) router.replace("/properties");
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = signUp({ email, password, firstName, lastName });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // auto sign-in after sign-up (demo)
    const loginRes = signIn(email, password);
    if (loginRes.ok) {
      router.push("/properties");
    } else {
      setBusy(false);
      setError("Signed up but auto-login failed.");
    }
  }

  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 shadow-sm p-6 bg-white">
        <h1 className="text-xl font-semibold mb-2">Create your account</h1>
        <p className="text-sm text-slate-600 mb-4">Demo-only account stored in your browser.</p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
              <input
                className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-blue-600 text-white py-2 hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="text-sm text-slate-600 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
