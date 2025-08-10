import React, { useState } from "react";
import Link from "next/link";

export default function PaymentsPage() {
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Header title="Payments" />

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-sm text-slate-600">0 payments</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search payments…"
            className="w-full md:w-72 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Date</Th>
                <Th>Tenant</Th>
                <Th>Property / Unit</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No payments yet. (Coming soon)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold hover:underline">Q Property</Link>
          <span className="text-slate-400">/</span>
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">Home</Link>
        </div>
      </div>
    </header>
  );
}

function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-4 py-2 text-left font-semibold ${className}`}>{children}</th>;
}
