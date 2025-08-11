// pages/reminders.tsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../lib/data";

type ID = string;
type LeaseStatus = "active" | "ended" | "pending";
type Tenant = { id: ID; firstName?: string; lastName?: string; fullName?: string; email?: string; phone?: string };
type Property = { id: ID; name: string; city?: string; state?: string };
type Lease = {
  id: ID; tenantId: ID; propertyId: ID; monthlyRent: number; dueDay: number;
  graceDays: number; status: LeaseStatus;
};

const fullName = (t?: Tenant) => {
  if (!t) return "—";
  if (t.fullName?.trim()) return t.fullName.trim();
  const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : (t.email?.split("@")[0] ?? "—");
};
const money = (n: number) => (isNaN(n) ? 0 : n).toLocaleString(undefined, { style: "currency", currency: "USD" });
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const dueDateFor = (lease: Lease, key = monthKey()) => { const [y, m] = key.split("-").map(Number); return new Date(y, m - 1, lease.dueDay); };

export default function RemindersPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [key, setKey] = useState<string>(monthKey());
  const [windowDays, setWindowDays] = useState<number>(10);

  useEffect(() => {
    let unsubs: Array<() => void> = [];
    (async () => {
      setLeases(await db.list<Lease>("leases"));
      setTenants(await db.list<Tenant>("tenants"));
      setProperties(await db.list<Property>("properties"));
      unsubs = [
        db.watch("leases", async () => setLeases(await db.list<Lease>("leases"))),
        db.watch("tenants", async () => setTenants(await db.list<Tenant>("tenants"))),
        db.watch("properties", async () => setProperties(await db.list<Property>("properties"))),
      ];
    })();
    return () => unsubs.forEach(fn => fn());
  }, []);

  const idxT = useMemo(() => new Map(tenants.map(t => [t.id, t])), [tenants]);
  const idxP = useMemo(() => new Map(properties.map(p => [p.id, p])), [properties]);

  const { upcoming, overdue } = useMemo(() => {
    const now = new Date();
    const soonLimit = new Date(); soonLimit.setDate(now.getDate() + windowDays);

    const base = (leases || []).filter(l => l.status !== "ended");
    const up: any[] = []; const od: any[] = [];

    base.forEach(l => {
      const due = dueDateFor(l, key);
      const lateStart = new Date(due); lateStart.setDate(lateStart.getDate() + (l.graceDays || 0) + 1);
      const obj = { lease: l, tenant: idxT.get(l.tenantId), property: idxP.get(l.propertyId), due, lateStart };
      if (now >= lateStart) od.push(obj);
      else if (due <= soonLimit && due >= now) up.push(obj);
    });

    up.sort((a, b) => a.due.getTime() - b.due.getTime());
    od.sort((a, b) => a.due.getTime() - b.due.getTime());
    return { upcoming: up, overdue: od };
  }, [leases, key, windowDays, idxT, idxP]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Reminders</h1>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500">Month</label>
            <input type="month" className="rounded border border-slate-300 px-3 py-2"
                   value={key} onChange={e => setKey(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Upcoming window (days)</label>
            <input type="number" min={1} className="rounded border border-slate-300 px-3 py-2 w-24"
                   value={windowDays} onChange={e => setWindowDays(parseInt(e.target.value || "10", 10))} />
          </div>
        </div>
      </div>

      {/* Due soon */}
      <Section title="Due soon" rows={upcoming} empty="No upcoming due dates in window." />

      {/* Overdue */}
      <Section title="Overdue" rows={overdue} empty="No overdue items. 🎉" />
    </main>
  );
}

function Section({ title, rows, empty }: { title: string; rows: any[]; empty: string }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-2">Tenant</th>
              <th className="text-left p-2">Property</th>
              <th className="text-left p-2">Due date</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="p-2 text-slate-500" colSpan={5}>{empty}</td></tr>
            )}
            {rows.map((r, i) => {
              const t = r.tenant as Tenant | undefined;
              const p = r.property as Property | undefined;
              const subject = encodeURIComponent(`Rent reminder — due ${r.due.toLocaleDateString()}`);
              const body = encodeURIComponent(
                `Hi ${fullName(t)},\n\nThis is a friendly reminder that your rent of ${money(
                  (r.lease as Lease).monthlyRent
                )} is due on ${r.due.toLocaleDateString()}.\n\nThank you!`
              );
              const emailHref = t?.email ? `mailto:${t.email}?subject=${subject}&body=${body}` : undefined;
              const smsHref = t?.phone ? `sms:${t.phone}?&body=${body}` : undefined;

              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-2">{fullName(t)}</td>
                  <td className="p-2">{p ? p.name : "—"}</td>
                  <td className="p-2">{r.due.toLocaleDateString()}</td>
                  <td className="p-2">{money((r.lease as Lease).monthlyRent)}</td>
                  <td className="p-2">
                    <div className="flex gap-3">
                      {emailHref ? <a className="text-blue-600 hover:underline" href={emailHref}>Email</a>
                        : <span className="text-slate-400">Email</span>}
                      {smsHref ? <a className="text-blue-600 hover:underline" href={smsHref}>SMS</a>
                        : <span className="text-slate-400">SMS</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
