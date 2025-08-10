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
            <a href="#pricing" className="px-4 py-2 rounded border border-slate-300 text-slate-900 hover:bg-slate-50">
              Sign in
            </a>
            <a href="#pricing" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
              Start free
            </a>
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
                <a href="#pricing" className="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Start free
                </a>
                <a href="#contact" className="px-5 py-3 rounded border border-slate-300 text-slate-900 hover:bg-slate-50">
                  Watch demo
                </a>
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

      {/* Pricing */}
      <section id="pricing" className="py-16 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp}>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-semibold">Simple, honest pricing</h2>
              <p className="text-slate-600 mt-2">Start free. Upgrade as you grow.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <TierCard
                name="Starter"
                price="$0"
                period="forever"
                cta="Start free"
                href="#contact"
                features={[
                  "Up to 2 units",
                  "Email & SMS reminders",
                  "Owner alerts",
                  "Auto statements",
                ]}
              />

              <TierCard
                name="Pro"
                highlight
                price="$12"
                period="/mo"
                sub="per owner"
                cta="Get Pro"
                href="#contact"
                features={[
                  "Up to 20 units",
                  "Everything in Starter",
                  "Late-fee automation",
                  "Import/export CSV",
                  "Priority support",
                ]}
              />

              <TierCard
                name="Growth"
                price="Custom"
                period=""
                cta="Talk to us"
                href="#contact"
                features={[
                  "20+ units",
                  "Bulk onboarding",
                  "Owner portals",
                  "Advanced reporting",
                ]}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact (placeholder anchor) */}
      <div id="contact" />

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

/* ---------- small components ---------- */

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5 shadow-sm bg-white">
      <div className="font-semibold">{title}</div>
      <div className="text-slate-600 text-sm mt-1">{desc}</div>
    </div>
  );
}

function TierCard(props: {
  name: string;
  price: string;
  period: string;
  sub?: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  const { name, price, period, sub, features, cta, href, highlight } = props;
  return (
    <div
      className={[
        "rounded-2xl border p-6 bg-white shadow-sm flex flex-col",
        highlight ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200",
      ].join(" ")}
    >
      <div className="mb-4">
        <div className="text-sm uppercase tracking-wide text-slate-500">{name}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-3xl font-semibold">{price}</div>
          <div className="text-slate-500">{period}</div>
          {sub ? <div className="text-slate-400 text-sm">({sub})</div> : null}
        </div>
      </div>

      <ul className="text-sm text-slate-600 space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
            {f}
          </li>
        ))}
      </ul>

      <a
        href={href}
        className={[
          "mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium",
          highlight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-slate-300 text-slate-900 hover:bg-slate-50",
        ].join(" ")}
      >
        {cta}
      </a>
    </div>
  );
}
