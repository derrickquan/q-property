import React, { useState } from "react";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const FORMSPREE_ENDPOINT = "https://formspree.io/f/manbabwz";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
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
          <motion.div {...fadeUp} className="space-y-6">
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
          </motion.div>

          {/* Right column */}
          <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 0.1 }}>
            <div className="rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <Stat label="Active doors" value="+4,200" />
              <Stat label="On-time" value="98%" />
              <Stat label="Setup time" value="< 10 min" />
              <Stat label="Support" value="7 days" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="space-y-8">
            <h2 className="text-2xl font-semibold">What you get</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard title="Rent reminders" desc="Automatic email/SMS reminders prior to due dates." />
              <FeatureCard title="Owner alerts" desc="Instant notifications for missed or partial rent." />
              <FeatureCard title="Late-fee automation" desc="Flat or percentage-based fees applied automatically." />
              <FeatureCard title="Statements" desc="Auto-generated monthly owner statements." />
              <FeatureCard title="Residential & commercial" desc="Flexible fields and tracking for both unit types." />
              <FeatureCard title="Import/export" desc="Upload spreadsheets and export reports anytime." />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="space-y-8 text-center">
            <h2 className="text-2xl font-semibold">Simple, transparent pricing</h2>
            <p className="text-slate-600">No hidden fees. Cancel anytime.</p>
            <div className="grid md:grid-cols-3 gap-6 pt-6">
              <PriceCard title="Starter" price="$9/mo" features={["Up to 5 units", "Basic reminders", "Email support"]} />
              <PriceCard title="Pro" price="$19/mo" features={["Up to 20 units", "Full automation", "Priority support"]} highlight />
              <PriceCard title="Enterprise" price="Custom" features={["Unlimited units", "Custom features", "Dedicated support"]} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...fadeUp} className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
            <h2 className="text-2xl font-semibold">Contact us</h2>
            <p className="text-slate-600 mt-2">Send a message and we’ll get back within one business day.</p>
            <ContactForm />
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
            <li>
              <a className="font-medium text-slate-900" href="#features">Product</a>
              <div>Features</div>
              <div>Contact</div>
            </li>
            <li>
              <div className="font-medium text-slate-900">Resources</div>
              <div>Guides</div>
              <div>Help center</div>
            </li>
            <li>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
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

function PriceCard({ title, price, features, highlight }: { title: string; price: string; features: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 shadow-sm ${highlight ? "border-blue-600 ring-2 ring-blue-600" : "border-slate-200"}`}>
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-3xl font-bold mt-2">{price}</div>
      <ul className="mt-4 space-y-1 text-slate-600 text-sm">
        {features.map((f) => <li key={f}>{f}</li>)}
      </ul>
      <button className="mt-6 w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
        Get started
      </button>
    </div>
  );
}

function ContactForm() {
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSending(true);
        setOk(null);

        const fd = new FormData(e.currentTarget as HTMLFormElement);
        if ((fd.get("company") as string)?.length) {
          setSending(false);
          return;
        }

        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: fd,
        });

        setSending(false);
        setOk(res.ok);
        if (res.ok) (e.currentTarget as HTMLFormElement).reset();
      }}
    >
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" />

      <input
        type="text"
        name="name"
        required
        placeholder="Your name"
        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        type="email"
        name="email"
        required
        placeholder="you@company.com"
        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <textarea
        name="message"
        required
        rows={5}
        placeholder="How can we help?"
        className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send message"}
        </button>
        <a
          href="mailto:hello@example.com"
          className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50"
        >
          Email us directly
        </a>
      </div>

      {ok === true && <p className="text-sm text-green-600 mt-2">Thanks! We’ll get back to you soon.</p>}
      {ok === false && <p className="text-sm text-red-600 mt-2">Sorry, something went wrong. Try again or email us directly.</p>}
    </form>
  );
}
