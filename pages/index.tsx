import React from "react";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            {/* Simple keyhole/doorway logo */}
            <svg width={28} height={28} viewBox="0 0 64 64" aria-label="Q Property logo">
              <defs>
                <linearGradient id="qg" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
              <rect x="8" y="6" width="48" height="52" rx="12" fill="url(#qg)" />
              <path d="M32 38a4 4 0 1 0 0-8a4 4 0 0 0 0 8z" fill="white" />
            </svg>
            <span className="font-semibold">Q Property</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#contact" className="hover:text-slate-900">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded border border-slate-300 text-slate-900 hover:bg-slate-50">
              Sign in
            </button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
              Start free
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          {/* Left column */}
          <motion.div {...fadeUp}>
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
                Q Property gives small-scale landlords and boutique managers the
                same powerful tools as big firms—without the complexity or cost.
              </p>

              <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
                <li>Email & SMS rent reminders</li>
                <li>Owner non-payment alerts/late-fee automation</li>
                <li>Auto monthly statements</li>
                <li>Residential & commercial support</li>
              </ul>

              <div className="flex flex-wrap gap-3 pt-3">
                <button className="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Start free
                </button>
                <button className="px-5 py-3 rounded border border-slate-300 text-slate-900 hover:bg-slate-50">
                  Watch demo
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right column / simple mock card */}
          <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 0.1 }}>
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
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp}>
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold">What you get</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                  title="Rent reminders"
                  desc="Automatic email/SMS reminders prior to due dates."
                />
                <FeatureCard
                  title="Owner alerts"
                  desc="Instant notifications for missed or partial rent."
                />
                <FeatureCard
                  title="Late-fee automation"
                  desc="Flat or percentage-based fees applied automatically."
                />
                <FeatureCard
                  title="Statements"
                  desc="Auto-generated monthly owner statements."
                />
                <FeatureCard
                  title="Residential & commercial"
                  desc="Flexible fields and tracking for both unit types."
                />
                <FeatureCard
                  title="Import/export"
                  desc="Upload spreadsheets and export reports anytime."
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg width={24} height={24} viewBox="0 0 64 64" aria-label="Q Property logo">
              <defs>
                <linearGradient id="qg2" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
              <rect x="8" y="6" width="48" height="52" rx="12" fill="url(#qg2)" />
              <path d="M32 38a4 4 0 1 0 0-8a4 4 0 0 0 0 8z" fill="white" />
            </svg>
            <div className="font-semibold">Q Property</div>
          </div>

          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-slate-500">
            <li className="space-y-2">
              <a className="font-medium text-slate-900" href="#features">Product</a>
              <div>Features</div>
              <div>Contact</div>
            </li>
            <li className="space-y-2">
              <div className="font-medium text-slate-900">Resources</div>
              <div>Guides</div>
              <div>Help center</div>
            </li>
            <li className="space-y-2">
              <div className="font-medium text-slate-900">Legal</div>
              <div>Privacy</div>
              <div>Terms</div>
            </li>
          </ul>
        </div>
        <div className="text-center text-slate-500 text-xs mt-8">
          © {new Date().getFullYear()} Q Property. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="font-semibold">{title}</div>
      <div className="text-slate-600 text-sm mt-1">{desc}</div>
    </div>
  );
}
