// pages/payments.tsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../lib/data";

/** Local types (kept minimal and aligned with other pages) */
type ID = string;
type LeaseStatus = "active" | "ended" | "pending";
type Increase = { year: number; type: "flat" | "percent"; value: number };

type Property = { id: ID; name: string; city?: string; state?: string };
type Tenant = { id: ID; firstName?: string; lastName?: string; fullName?: string; email?: string; phone?: string };
type Lease = {
  id: ID; tenantId: ID; propertyId: ID;
  monthlyRent: number; dueDay: number; securityDeposit: number;
  startDate: string; endDate?: string;
  graceDays: number; lateFeeType: "flat" | "percent"; lateFeeValue: number;
  increases?: Increase[]; status: LeaseStatus; notes?: string; locked?: boolean;
};
type Payment = {
  id: ID; leaseId: ID; monthKey: string;
  amount: number; date: string; method: "cash" | "check" | "ach" | "card" | "other";
  lateFeeApplied: number; notes?: string;
};

const money = (n: number) => (isNaN(n) ? 0 : n).toLocaleString(undefined, { style: "currency", currency: "USD" });
const fullName = (t?: Tenant) => {
  if (!t) return "—";
  if (t.fullName?.trim()) return t.fullName.trim();
  const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : (t.email?.split("@")[0] ?? "—");
};
const todayKey = () => {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const dueDateFor = (lease: Lease, key = todayKey()) => {
  const [y, m] = key.split("-").map(Number); return new Date(y, m - 1, lease.dueDay);
};
const lateFeeFor = (lease: Lease, paidISO: string, monthKey: string) => {
  const paid = new Date(paidISO); const due = dueDateFor(lease, monthKey);
  const lateStart = new Date(due); lateStart.setDate(lateStart.getDate() + (lease.graceDays || 0) + 1);
  if (paid < lateStart) return 0;
  return lease.lateFeeType === "flat"
    ? (lease.lateFeeValue || 0)
    : Math.round((lease.monthlyRent * (lease.lateFeeValue || 0) / 100) * 100) / 100;
};

export default function PaymentsPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthKey, setMonthKey] = useState<string>(todayKey());
  const [modal, setModal] = useState<{ lease: Lease | null; open: boolean }>({ lease: null, open: false });

  // load + subscribe
  useEffect(() => {
    let unsubs: Array<() => void> = [];
    (async () => {
      setLeases(await db.list<Lease>("leases"));
      setTenants(await db.list<Tenant>("tenants"));
      setProperties(await db.list<Property>("properties"));
      setPayments(await db.list<Payment>("payments"));
      unsubs = [
        db.watch("leases", async () => setLeases(await db.list<Lease>("leases"))),
        db.watch("tenants", async () => setTenants(await db.list<Tenant>("tenants"))),
        db.watch("properties", async () => setProperties(await db.list<Property>("properties"))),
        db.watch("payments", async () => setPayments(await db.list<Payment>("payments"))),
      ];
    })();
    return () => unsubs.forEach(fn => fn());
  }, []);

  const idxTenant = useMemo(() => new Map(tenants.map(t => [t.id, t])), [tenants]);
  const idxProp = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);

  const rows = useMemo(() => {
    return (leases || [])
      .filter(l => l.status !== "ended")
      .map(l => {
        const t = idxTenant.get(l.tenantId);
        const p = idxProp.get(l.propertyId);
        const propLabel = p ? `${p.name}${p.city ? ` — ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}` : "—";
        const payThisMonth = (payments || []).filter(pay => pay.leaseId === l.id && pay.monthKey === monthKey);
        const totalPaid = payThisMonth.reduce((s, p) => s + p.amount, 0);
        const totalLate = payThisMonth.reduce((s, p) => s + (p.lateFeeApplied || 0), 0);
        const balance = Math.max(0, l.monthlyRent + totalLate - totalPaid);

        const now = new Date();
        const due = dueDateFor(l, monthKey);
        const lateStart = new Date(due); lateStart.setDate(lateStart.getDate() + (l.graceDays || 0) + 1);
        let status: "Paid" | "Due" | "Overdue" = "Due";
        if (balance <= 0) status = "Paid"; else if (now >= lateStart) status = "Overdue";

        return { id: l.id, tenant: fullName(t), property: propLabel, monthlyRent: l.monthlyRent, balance, status, lease: l };
      });
  }, [leases, payments, monthKey, idxTenant, idxProp]);

  function openPayModal(lease: Lease) { setModal({ lease, open: true }); }

  async function savePayment(p: Payment) {
    await db.add<Payment>("payments", p);
    setPayments(await db.list<Payment>("payments"));
  }

  async function deletePayment(id: string) {
    await db.remove("payments", id);
    setPayments(await db.list<Payment>("payments"));
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <div>
          <label className="block text-xs text-slate-500">Month</label>
          <input type="month" className="rounded border border-slate-300 px-3 py-2"
                 value={monthKey} onChange={e => setMonthKey(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Tenant</th>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Monthly</th>
              <th className="text-left p-3">Balance</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="p-3 text-slate-500" colSpan={6}>No active leases.</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{r.tenant}</td>
                <td className="p-3">{r.property}</td>
                <td className="p-3">{money(r.monthlyRent)}</td>
                <td className="p-3">{money(r.balance)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    r.status === "Paid" ? "bg-green-100 text-green-700"
                    : r.status === "Overdue" ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 pr-4 text-right">
                  <button className="text-blue-600 hover:underline" onClick={() => openPayModal(r.lease)}>
                    Record payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* list of payments for current month */}
      <PaymentList monthKey={monthKey} payments={payments} leases={leases} tenants={tenants} onDelete={deletePayment} />

      {modal.open && modal.lease && (
        <PaymentModal
          lease={modal.lease}
          monthKey={monthKey}
          onClose={() => setModal({ lease: null, open: false })}
          onSave={savePayment}
        />
      )}
    </main>
  );
}

function PaymentList({
  monthKey, payments, leases, tenants, onDelete,
}: {
  monthKey: string;
  payments: Payment[];
  leases: Lease[];
  tenants: Tenant[];
  onDelete: (id: string) => void;
}) {
  const fullNameT = (id: string) => {
    const l = leases.find(x => x.id === id);
    const t = tenants.find(x => x.id === l?.tenantId);
    if (!t) return "—";
    if (t.fullName?.trim()) return t.fullName.trim();
    const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
    return parts.length ? parts.join(" ") : (t.email?.split("@")[0] ?? "—");
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Payments this month</h2>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Tenant</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Late fee</th>
              <th className="text-left p-2">Method</th>
              <th className="text-left p-2">Notes</th>
              <th className="text-right p-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.filter(p => p.monthKey === monthKey).map(p => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-2">{p.date}</td>
                <td className="p-2">{fullNameT(p.leaseId)}</td>
                <td className="p-2">{money(p.amount)}</td>
                <td className="p-2">{money(p.lateFeeApplied)}</td>
                <td className="p-2 uppercase">{p.method}</td>
                <td className="p-2">{p.notes || "—"}</td>
                <td className="p-2 pr-4 text-right">
                  <button className="text-slate-600 hover:underline" onClick={() => onDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {payments.filter(p => p.monthKey === monthKey).length === 0 && (
              <tr><td className="p-2 text-slate-500" colSpan={7}>No payments recorded for {monthKey}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentModal({
  lease, monthKey, onClose, onSave,
}: {
  lease: Lease; monthKey: string; onClose: () => void; onSave: (p: Payment) => void;
}) {
  const [amount, setAmount] = useState<number>(lease.monthlyRent);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<Payment["method"]>("ach");
  const [notes, setNotes] = useState<string>("");

  const computedLate = useMemo(() => lateFeeFor(lease, date, monthKey), [lease, date, monthKey]);

  function save() {
    onSave({
      id: `PAY-${Date.now()}`,
      leaseId: lease.id,
      monthKey,
      amount: isNaN(amount) ? 0 : amount,
      date,
      method,
      notes,
      lateFeeApplied: computedLate,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-lg shadow-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Record payment — {monthKey}</h3>
          <button className="text-slate-600 hover:text-slate-900" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
              <span className="px-2 py-2 text-slate-500">$</span>
              <input type="number" min={0} step="0.01" className="w-full px-3 py-2 outline-none"
                     value={amount} onChange={e => setAmount(parseFloat(e.target.value || "0"))}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Paid date</label>
              <input type="date" className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                     value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">Method</label>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                      value={method} onChange={e => setMethod(e.target.value as any)}>
                <option value="ach">ACH</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Late fee (auto)</label>
            <div className="mt-1 px-3 py-2 rounded border border-slate-200 bg-slate-50">
              {money(computedLate)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Calculated from due day + grace period.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes (optional)</label>
            <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                   value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700" onClick={save}>Save payment</button>
        </div>
      </div>
    </div>
  );
}
