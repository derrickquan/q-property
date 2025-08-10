import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

// Keyhole / doorway logo
function QLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Q Property • v2 • v2 logo">
      <defs>
        <linearGradient id="qg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#qg)" />
      {/* door body */}
      <path d="M24 48V22a8 8 0 0 1 8-8h0a8 8 0 0 1 8 8v26z" fill="white" />
      {/* keyhole */}
      <path d="M32 28a4 4 0 1 0 0.001 0z M30 34h4v6h-4z" fill="#0f172a" />
    </svg>
  );
}

const SETUP_TIME_LABEL = '< 10 min';

const kpis = [
  { month: 'Jan', value: 92 },
  { month: 'Feb', value: 93 },
  { month: 'Mar', value: 95 },
  { month: 'Apr', value: 96 },
  { month: 'May', value: 97 },
  { month: 'Jun', value: 97 },
];

const demoUnits = [
  { id: 1, name: '110 Maple St, #A', type: 'Residential', units: 1, rent: 2350, status: 'Rented' },
  { id: 2, name: 'Sunset Plaza Retail', type: 'Commercial', units: 3, rent: 8200, status: 'Partial' },
  { id: 3, name: 'Cedar Fourplex', type: 'Residential', units: 4, rent: 7100, status: 'Rented' },
];

export default function Home() {
  const mrr = useMemo(() => demoUnits.reduce((s, u) => s + u.rent, 0), []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl grid place-items-center">
              <QLogo size={36} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Q Property</div>
              <div className="text-xs text-slate-500">Software for small portfolios</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features">Features</a>
            <a href="#automation">Automation</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-2xl border border-slate-300 text-slate-900 hover:bg-slate-50">Sign in</button>
            <button className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700">Start free</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
           
          ><div className="space-y-6">
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
              Q Property gives small-scale landlords and boutique managers the same powerful tools as big firms—without the complexity or cost.
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
              <li>Email & SMS rent reminders</li>
              <li>Owner non-payment alerts</li>
              <li>Auto monthly statements</li>
              <li>Late-fee rules (flat or %, with caps)</li>
              <li>Residential & commercial support</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button className="px-5 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700">Start free</button>
              <button className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-900 hover:bg-slate-50">Watch demo</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Active doors</div>
                <div className="text-2xl font-semibold">4,200+</div>
                <div className="text-xs text-slate-500">1–20 per owner</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Avg. on-time</div>
                <div className="text-2xl font-semibold">98%</div>
                <div className="text-xs text-slate-500">with AutoPay</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Setup time</div>
                <div className="text-2xl font-semibold">{SETUP_TIME_LABEL}</div>
                <div className="text-xs text-slate-500">import spreadsheet</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">Support</div>
                <div className="text-2xl font-semibold">7 days</div>
                <div className="text-xs text-slate-500">email & chat</div>
              </div>
            </div>
          </div></motion.div>

          {/* KPI Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="shadow-xl rounded-2xl border border-slate-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Collections & Occupancy</h3>
              </div>
              <div className="p-6 pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpis} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-sm">
                    <div className="font-medium">Monthly Recurring Rent</div>
                    <div className="text-slate-500">${mrr.toLocaleString()}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Late fees auto-applied</div>
                    <div className="text-slate-500">Rules by unit</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Automation & Notifications</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Email & SMS rent reminders', desc: 'Automatic nudges before due date with smart follow-ups.' },
              { title: 'Owner non-payment alerts', desc: 'Get notified when a tenant misses rent or AutoPay fails.' },
              { title: 'Auto statements', desc: 'Monthly owner statements delivered to your inbox.' },
              { title: 'Late fee rules', desc: 'Flat or % fees, caps, and grace periods.' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-slate-200">
                <div className="p-6"><h3 className="text-lg font-semibold">{f.title}</h3></div>
                <div className="p-6 pt-0 text-sm text-slate-600">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact stub */}
      <section id="contact" className="py-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Get in touch</h2>
          <div className="rounded-2xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600">This is a static demo. We can wire email/SMS next.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-sm border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <QLogo size={36} />
            <div>
              <div className="font-semibold">Q Property</div>
              <div className="text-slate-500 text-xs">© {new Date().getFullYear()} All rights reserved.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-slate-500">
            <ul className="space-y-2">
              <li className="font-medium text-slate-900">Product</li>
              <li><a href="#features">Features</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
            <ul className="space-y-2">
              <li className="font-medium text-slate-900">Resources</li>
              <li><a href="#">Guides</a></li>
              <li><a href="#">Help center</a></li>
            </ul>
            <ul className="space-y-2">
              <li className="font-medium text-slate-900">Legal</li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
