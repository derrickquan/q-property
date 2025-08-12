import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { startFree, getUser } from "../lib/auth";

export default function StartPage() {
  const router = useRouter();
  const [name, setName] = useState("John Smith");
  const [email, setEmail] = useState("JohnSmith@gmail.com");
  const [password, setPassword] = useState("123");
  const [busy, setBusy] = useState(false);

  // If already logged in, skip
  useEffect(() => {
    if (getUser()) router.replace("/properties");
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      startFree(name, email, password);
      router.push("/properties");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 shadow-sm p-6 bg-white">
        <h1 className="text-xl font-semibold mb-2">Create your account</h1>
        <p className="text-sm text-slate-600 mb-4">
          This is a demo-only account stored in your browser.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••"
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
