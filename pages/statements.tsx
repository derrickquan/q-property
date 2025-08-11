// pages/statements.tsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../lib/data";

/** ---- Minimal local types to avoid drift ---- */
type ID = string;
type LeaseStatus = "active" | "ended" | "pending";
type Increase = { year: number; type: "flat" | "percent"; value: number };

type Property = { id: ID; name: string; city?: string; state?: string };
type Tenant = {
  id: ID;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
};
type Lease = {
  id: ID;
  tenantId: ID;
  propertyId: ID;
  monthlyRent: number;
  dueDay: number; // 1..28
  securityDeposit: number;
  startDate: string; // yyyy-mm-dd
  endDate?: string;
  graceDays: number;
  lateFeeType: "flat" | "percent";
  lateFeeValue: number;
  increases?: Increase[];
  status: LeaseStatus;
  notes?: string;
  locked?: boolean;
};

type Payment = {
  id: ID;
  leaseId: ID;
  monthKey: string; // YYYY-MM
  amount: number;
  date: string; // yyyy-mm-dd
  method: "cash" | "check" | "ach" | "card" | "other";
  lateFeeApplied: number;
  notes?: string;
};

/** ---- Utils ---- */
const money = (n: number) =>
  (isNaN(n) ? 0 : n).toLocaleString(undefined, { style: "currency", currency: "USD" });

const fullName = (t?: Tenant) => {
  if (!t) return "—";
  if (t.fullName?.trim()) return t.fullName.trim();
  const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : (t.email?.split("@")[0] ?? "—");
};

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

function monthRange(key: string) {
  const [y, m] = key.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day of month
  return { start, end };
}

function leaseCoversMonth(lease: Lease, key: string) {
  const { start, end } = monthRange(key);
  const ls = new Date(lease.startDate);
  const le = lease.endDate ? new Date(lease.endDate) : undefined;
  // active if (lease starts on/before month end) and (no end OR end on/after month start)
  const startsBeforeMonthEnds = ls <= end;
  const endsAfterMonthStarts = !le || le >= start;
  return startsBeforeMonthEnds && endsAfterMonthStarts && lease.status !== "ended";
}

/** Build per-tenant rows + totals for a property + month */
function buildStatementForProperty({
  propertyId,
  month,
  leases,
  tenants,
  payments,
}: {
  propertyId: ID;
  month: string;
  leases: Lease[];
  tenants: Tenant[];
  payments: Payment[];
}) {
  const tIdx = new Map(tenants.map(t => [t.id, t]));
  const propertyLeases = leases.filter(l => l.propertyId === propertyId && leaseCoversMonth(l, month));

  const rows = propertyLeases.map(l => {
    const t = tIdx.get(l.tenantId);
    const pays = payments.filter(p => p.leaseId === l.id && p.monthKey === month);
    const paid = pays.reduce((s, p) => s + p.amount, 0);
    const lateFees = pays.reduce((s, p) => s + (p.lateFeeApplied || 0), 0);
    const scheduled = l.monthlyRent;
    const balance = Math.max(0, scheduled + lateFees - paid);
    return {
      leaseId: l.id,
      tenantName: fullName(t),
      scheduled,
      paid,
      lateFees,
      balance,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.scheduled += r.scheduled;
      acc.paid += r.paid;
      acc.lateFees += r.lateFees;
      acc.balance += r.balance;
      return acc;
    },
    { scheduled: 0, paid: 0, lateFees: 0, balance: 0 }
  );

  return { rows, totals };
}

/** CSV helper */
function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const content = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** ---- Page ---- */
export default function StatementsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [propId, setPropId] = useState<string>("");
  const [mKey, setMKey] = useState<string>(monthKey());

  // Load + watch like a backend subscription
  useEffect(() => {
    let unsubs: Array<() => void> = [];
    (async () => {
      setProperties(await db.list<Property>("properties"));
      setTenants(await db.list<Tenant>("tenants"));
      setLeases(await db.list<Lease>("leases"));
      setPayments(await db.list<Payment>("payments"));

      unsubs = [
        db.watch("properties", async () => setProperties(await db.list<Property>("properties"))),
        db.watch("tenants", async () => setTenants(await db.list<Tenant>("tenants"))),
        db.watch("leases", async () => setLeases(await db.list<Lease>("leases"))),
        db.watch("payments", async () => setPayments(await db.list<Payment>("payments"))),
      ];
    })();
    return () => unsubs.forEach(fn => fn());
  }, []);

  const propertyOptions = useMemo(
    () => properties.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [properties]
  );

  // Pick first property by default once loaded
  useEffect(() => {
    if (!propId && propertyOptions.length > 0) {
      setPropId(propertyOptions[0].id);
    }
  }, [propId, propertyOptions]);

  const statement = useMemo(() => {
    if (!propId) return null;
    return buildStatementForProperty({
      propertyId: propId,
      month: mKey,
      leases,
      tenants,
      payments,
    });
  }, [propId, mKey, leases, tenants, payments]);

  function handleExportCsv() {
    if (!statement) return;
    const prop = properties.find(p => p.id === propId);
    const filename = `statement-${(prop?.name || "property")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${mKey}.csv`;
    const headers = ["Tenant", "Scheduled Rent", "Paid", "Late Fees", "Balance"];
    const rows = [
      ...statement.rows.map(r => [
        r.tenantName,
        r.scheduled,
        r.paid,
        r.lateFees,
        r.balance,
      ]),
      ["TOTAL", statement.totals.scheduled, statement.totals.paid, statement.totals.lateFees, statement.totals.balance],
    ];
    exportCsv(filename, headers, rows);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 print:hidden">
        <h1 className="text-2xl font-semibold">Statements</h1>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500">Property</label>
            <select
              className="rounded border border-slate-300 px-3 py-2 min-w-[240px]"
              value={propId}
              onChange={(e) => setPropId(e.target.value)}
            >
              {propertyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.city ? ` — ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}
                </option>
              ))}
              {propertyOptions.length === 0 && <option value="">No properties</option>}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500">Month</label>
            <input
              type="month"
              className="rounded border border-slate-300 px-3 py-2"
              value={mKey}
              onChange={(e) => setMKey(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-50"
              onClick={() => window.print()}
            >
              Print
            </button>
            <button
              className="px-3 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
              onClick={handleExportCsv}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statement Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
            <div>
              <div className="text-sm text-slate-500">Owner Statement</div>
              <h2 className="text-xl font-semibold">
                {properties.find((p) => p.id === propId)?.name || "—"}
              </h2>
            </div>
            <div className="text-slate-600">
              Period:{" "}
              <span className="font-medium">
                {(() => {
                  const { start, end } = monthRange(mKey);
                  return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Summary */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <SummaryItem label="Scheduled Rent" value={money(statement?.totals.scheduled || 0)} />
            <SummaryItem label="Late Fees" value={money(statement?.totals.lateFees || 0)} />
            <SummaryItem label="Payments Received" value={money(statement?.totals.paid || 0)} />
            <SummaryItem label="Balance Due" value={money(statement?.totals.balance || 0)} />
          </div>

          {/* Line items */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Tenant</th>
                  <th className="text-right p-3">Scheduled</th>
                  <th className="text-right p-3">Paid</th>
                  <th className="text-right p-3">Late Fees</th>
                  <th className="text-right p-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {!statement || statement.rows.length === 0 ? (
                  <tr>
                    <td className="p-3 text-slate-500" colSpan={5}>
                      No active leases for this property/month.
                    </td>
                  </tr>
                ) : (
                  <>
                    {statement.rows.map((r) => (
                      <tr key={r.leaseId} className="border-t border-slate-100">
                        <td className="p-3">{r.tenantName}</td>
                        <td className="p-3 text-right">{money(r.scheduled)}</td>
                        <td className="p-3 text-right">{money(r.paid)}</td>
                        <td className="p-3 text-right">{money(r.lateFees)}</td>
                        <td className="p-3 text-right">{money(r.balance)}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-300 bg-slate-50 font-medium">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">{money(statement.totals.scheduled)}</td>
                      <td className="p-3 text-right">{money(statement.totals.paid)}</td>
                      <td className="p-3 text-right">{money(statement.totals.lateFees)}</td>
                      <td className="p-3 text-right">{money(statement.totals.balance)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="text-xs text-slate-500 mt-4 print:mt-8">
            * Scheduled rent is calculated from active leases covering this month. Payments and late
            fees are based on recorded entries for the selected month.
          </div>
        </div>
      </div>

      {/* Simple print styles */}
      <style jsx global>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 bg-white">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
