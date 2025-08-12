import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getUser } from "../lib/auth";

/**
 * Landing page:
 * - If logged in, immediately redirect to /properties
 * - If logged out, show the hero/marketing content
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getUser()) {
      router.replace("/properties");
    }
  }, [router]);

  // Visible only when LOGGED OUT
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <span className="inline-flex w-fit items-center rounded-2xl px-3 py-1 text-xs font-medium bg-slate-900 text-white">
            Built for 1–20 units
          </span>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Powerful Leasing Software for Independent Owners
          </h1>

          <p className="text-lg font-medium text-blue-600">
            Big-firm tools, small-portfolio focus.
          </p>

          <p className="text-slate-600 text-lg">
            Q Property gives small-scale landlords and boutique managers the same powerful tools
            as big firms—without the complexity or cost.
          </p>

          <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
            <li>Email & SMS rent reminders</li>
            <li>Owner non-payment alerts & late-fee automation</li>
            <li>Auto monthly statements</li>
            <li>Residential & commercial support</li>
          </ul>

          <div className="flex flex-wrap gap-3 pt-3">
            <Link href="/start" className="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">
              Start free
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded border border-slate-300 text-slate-900 hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm uppercase tracking-wide text-slate-500">Active doors</div>
              <div className="text-2xl font-semibold">+4,200</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm uppercase tracking-wide text-slate-500">On-time</div>
              <div className="text-2xl font-semibold">98%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm uppercase tracking-wide text-slate-500">Setup time</div>
              <div className="text-2xl font-semibold">&lt; 10 min</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm uppercase tracking-wide text-slate-500">Support</div>
              <div className="text-2xl font-semibold">7 days</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
