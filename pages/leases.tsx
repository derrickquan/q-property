// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Property, Tenant, Lease } from "../lib/types";
import { load, save } from "../lib/storage";

/** ---------------- helpers ---------------- */
const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString() : "—";

function fullName(t?: Tenant | null): string {
  if (!t) return "—";
  if ((t as any).fullName && (t as any).fullName.trim()) return (t as any).fullName;
  const parts = [t.firstName, t.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

function seedIfEmpty() {
  // Seed properties (3 mocks) if none found

const mockProperties: Property[] = [
  {
    id: "mock-p1",
    name: "Maplewood Apartments",
    address1: "110 Maple St, #A",
    city: "Los Angeles",
    state: "CA",
    zip: "90012",
    unitCount: 12,
    type: "residential",
    notes: "Sample data",
  },
  {
    id: "mock-p2",
    name: "Sunset Plaza Retail",
    address1: "200 Sunset Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90028",
    unitCount: 3,
    type: "commercial",
    notes: "Sample data",
  },
  {
    id: "mock-p3",
    name: "Cedar Fourplex",
    address1: "15 Cedar Ave",
    city: "Pasadena",
    state: "CA",
    zip: "91101",
    unitCount: 4,
    type: "residential",
    notes: "Sample data",
  },
];
  
    save("properties", seeded);
  }

  // Seed tenants (5 mocks) if none found
  const ts = load<Tenant[]>("tenants", []);
  if (!ts || ts.length === 0) {
    const seededT: Tenant[] = [
      {
        id: "t1",
        firstName: "Elliot",
        lastName: "Nguyen",
        email: "elliot@example.com",
        phone: "(415) 555-0100",
        propertyId: "",
        unitLabel: "",
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "t2",
        firstName: "Brianna",
        lastName: "Lopez",
        email: "brianna@example.com",
        phone: "(415) 555-0101",
        propertyId: "",
        unitLabel: "",
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "t3",
        firstName: "Chris",
        lastName: "Patel",
        email: "chris@example.com",
        phone: "(415) 555-0102",
        propertyId: "",
        unitLabel: "",
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "t4",
        firstName: "Elliot",
        lastName: "Kim",
        email: "elliot.kim@example.com",
        phone: "",
        propertyId: "",
        unitLabel: "",
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "t5",
        firstName: "Rhea",
        lastName: "Singh",
        email: "rhea@example.com",
        phone: "",
        propertyId: "",
        unitLabel: "",
        notes: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    save("tenants", seededT);
  }

  // Seed one demo lease for Elliot if none found
  const leases = load<Lease[]>("leases", []);
  if (!leases || leases.length === 0) {
    const tenant = (load<Tenant[]>("tenants", []) || []).find((t) => t.firstName === "Elliot" && t.lastName === "Nguyen");
    const prop = (load<Property[]>("properties", []) || [])[0];
    if (tenant && prop) {
      const demo: Lease = {
        id: "L-DEMO-1",
        tenantId: tenant.id,
        propertyId: prop.id,
        monthlyRent: 2450,
        dueDay: 1,
        securityDeposit: 3000,
        startDate: new Date(new Date().getFullYear(), 7, 10).toISOString().slice(0, 10), // Aug 10 this year
        endDate: new Date(new Date().getFullYear() + 3, 7, 28).toISOString().slice(0, 10), // Aug 28 +3y
        graceDays: 0,
        lateFeeType: "flat",
        lateFeeValue: 50,
        status: "active",
        notes: "",
        // locking
        locked: true,
        // schedule (yearly)
        increases: [
          { year: 2, type: "percent", value: 3 },
          { year: 3, type: "percent", value: 3 },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      save("leases", [demo]);
    }
  }
}

/** build a yearly schedule from a lease */
function buildSchedule(lease: Lease) {
  const rows: Array<{ period: string; yearIndex: number; rent: number }> = [];
  const start = new Date(lease.startDate);
  const end = lease.endDate ? new Date(lease.endDate) : null;

  // compute per-year rent with increases
  let rent = lease.monthlyRent;
  const increasesByYear = new Map<number, { type: "flat" | "percent"; value: number }>();
  (lease.increases || []).forEach((inc) => increasesByYear.set(inc.year, { type: inc.type, value: inc.value }));

  // iterate years 1..N based on end date (or 5 year default)
  const totalYears =
    end && end > start ? Math.max(1, end.getFullYear() - start.getFullYear() + 1) : 5;

  for (let y = 1; y <= totalYears; y++) {
    // apply increase at the beginning of year y (except year 1)
    if (y > 1 && increasesByYear.has(y)) {
      const inc = increasesByYear.get(y)!;
      rent = inc.type === "flat" ? rent + inc.value : rent * (1 + inc.value / 100);
    }

    const periodStart = new Date(start);
    periodStart.setFullYear(start.getFullYear() + (y - 1));

    const periodEnd = new Date(periodStart);
    periodEnd.setFullYear(periodStart.getFullYear() + 1);
    periodEnd.setDate(periodEnd.getDate() - 1);

    // clamp by lease end
    let label = `${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}`;
    if (end && periodEnd > end) {
      label = `${periodStart.toLocaleDateString()} – ${end.toLocaleDateString()}`;
    }
    rows.push({ period: label, yearIndex: y, rent: Math.round(rent * 100) / 100 });

    if (end && periodEnd >= end) break;
  }

  return rows;
}

/** ---------------- page ---------------- */
export default function LeasesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);

  useEffect(() => {
    seedIfEmpty();
    setProperties(load<Property[]>("properties", []));
    setTenants(load<Tenant[]>("tenants", []));
    setLeases(load<Lease[]>("leases", []));
  }, []);

  const rows = useMemo(() => {
    const byTenant = new Map(tenants.map((t) => [t.id, t]));
    const byProp = new Map(properties.map((p) => [p.id, p]));
    return (leases || []).map((l) => {
      const t = byTenant.get(l.tenantId);
      const p = byProp.get(l.propertyId);
      return {
        id: l.id,
        tenant: fullName(t),
        property: p
          ? `${p.name}${p.city ? ` — ${p.city}, ${p.state ?? ""}` : ""}`
          : "—",
        monthly: money(l.monthlyRent),
        dueDay: l.dueDay,
        start: fmtDate(l.startDate),
        end: fmtDate(l.endDate),
        status: (l.status || "active").replace(/^\w/, (c) => c.toUpperCase()),
      };
    });
  }, [leases, tenants, properties]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* NOTE: No page-level header here; navbar comes from _app.tsx */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Leases</h1>
        <div className="flex gap-2">
          <Link
            href="/tenants"
            className="px-3 py-2 rounded border border-slate-300 text-slate-900 hover:bg-slate-50"
          >
            Back to Tenants
          </Link>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            Add lease
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Tenant</th>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Monthly rent</th>
              <th className="text-left p-3">Due day</th>
              <th className="text-left p-3">Start</th>
              <th className="text-left p-3">End</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={8}>
                  No leases yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">{r.tenant}</td>
                <td className="p-3">{r.property}</td>
                <td className="p-3">{r.monthly}</td>
                <td className="p-3">{r.dueDay}</td>
                <td className="p-3">{r.start}</td>
                <td className="p-3">{r.end}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3 pr-4 text-right">
                  <button
                    className="text-blue-600 hover:underline mr-3"
                    onClick={() => {
                      const l = (leases || []).find((x) => x.id === r.id) || null;
                      setEditing(l);
                      setShowModal(true);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="text-slate-600 hover:underline"
                    onClick={() => {
                      if (!confirm("Delete this lease?")) return;
                      const next = (leases || []).filter((x) => x.id !== r.id);
                      save("leases", next);
                      setLeases(next);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <LeaseModal
          onClose={() => setShowModal(false)}
          onSaved={(lease) => {
            // auto-lock after save
            const locked: Lease = { ...lease, locked: true, updatedAt: Date.now() };
            const list = load<Lease[]>("leases", []);
            const exists = list.findIndex((l) => l.id === locked.id);
            const next =
              exists >= 0
                ? [...list.slice(0, exists), locked, ...list.slice(exists + 1)]
                : [...list, locked];
            save("leases", next);
            setLeases(next);
            setShowModal(false);
          }}
          initial={editing}
          tenants={tenants}
          properties={properties}
        />
      )}
    </main>
  );
}

/** ---------------- modal ---------------- */

type ModalProps = {
  initial: Lease | null;
  tenants: Tenant[];
  properties: Property[];
  onClose: () => void;
  onSaved: (l: Lease) => void;
};

function LeaseModal({ initial, tenants, properties, onClose, onSaved }: ModalProps) {
  const [tenantId, setTenantId] = useState(initial?.tenantId ?? "");
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? "");
  const [monthlyRent, setMonthlyRent] = useState<number>(initial?.monthlyRent ?? 0);
  const [dueDay, setDueDay] = useState<number>(initial?.dueDay ?? 1);
  const [securityDeposit, setSecurityDeposit] = useState<number>(initial?.securityDeposit ?? 0);
  const [startDate, setStartDate] = useState<string>(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState<string>(initial?.endDate ?? "");
  const [graceDays, setGraceDays] = useState<number>(initial?.graceDays ?? 0);
  const [lateFeeType, setLateFeeType] = useState<"flat" | "percent">(initial?.lateFeeType ?? "flat");
  const [lateFeeValue, setLateFeeValue] = useState<number>(initial?.lateFeeValue ?? 0);
  const [status, setStatus] = useState<"active" | "ended" | "pending">(initial?.status ?? "active");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  const [increases, setIncreases] = useState<
    { year: number; type: "flat" | "percent"; value: number }[]
  >(initial?.increases ?? []);

  const [unlocked, setUnlocked] = useState<boolean>(!initial?.locked);

  const byTenant = useMemo(() => new Map(tenants.map((t) => [t.id, t])), [tenants]);
  const byProp = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  const schedule = useMemo(() => {
    const sketch: Lease = {
      id: initial?.id ?? "",
      tenantId,
      propertyId,
      monthlyRent,
      dueDay,
      securityDeposit,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || undefined,
      graceDays,
      lateFeeType,
      lateFeeValue,
      status,
      notes,
      locked: initial?.locked ?? false,
      increases,
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    try {
      return buildSchedule(sketch);
    } catch {
      return [];
    }
  }, [
    tenantId,
    propertyId,
    monthlyRent,
    dueDay,
    securityDeposit,
    startDate,
    endDate,
    graceDays,
    lateFeeType,
    lateFeeValue,
    status,
    notes,
    increases,
    initial,
  ]);

  const canSave =
    unlocked &&
    tenantId &&
    propertyId &&
    monthlyRent >= 0 &&
    dueDay >= 1 &&
    dueDay <= 28 &&
    startDate;

  function saveLease() {
    if (!canSave) return;
    const payload: Lease = {
      id: initial?.id ?? `L-${Date.now()}`,
      tenantId,
      propertyId,
      monthlyRent,
      dueDay,
      securityDeposit,
      startDate,
      endDate: endDate || undefined,
      graceDays,
      lateFeeType,
      lateFeeValue,
      status,
      notes,
      increases,
      locked: true, // lock on save
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    onSaved(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full max-w-5xl rounded-lg shadow-lg max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {initial ? "Lease details" : "Add lease"}
          </h2>
          <button
            className="text-slate-600 hover:text-slate-900"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* content (scrollable) */}
        <div className="overflow-y-auto p-4">
          {/* lock / unlock bar */}
          {initial && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {initial.locked && !unlocked
                  ? "This lease is locked. Unlock to edit."
                  : "Lease is unlocked. You can edit fields below."}
              </span>
              <button
                className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
                onClick={() => setUnlocked((v) => !v)}
              >
                {initial.locked && !unlocked ? "Unlock" : "Lock"}
              </button>
            </div>
          )}

          {/* grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tenant */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Tenant</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                <option value="">— Select tenant —</option>
                {tenants
                  .slice()
                  .sort((a, b) => fullName(a).localeCompare(fullName(b)))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {fullName(t)}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-slate-500 mt-1 w-full break-all">
                {fullName(byTenant.get(tenantId) || null)}
              </p>
            </div>

            {/* Property */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Property</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">— Select property —</option>
                {properties
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {`${p.name}${p.city ? ` — ${p.city}, ${p.state ?? ""}` : ""}`}
                    </option>
                  ))}
              </select>
            </div>

            {/* Monthly rent */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Monthly rent</label>
              <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
                <span className="px-2 py-2 text-slate-500">$</span>
                <input
                  disabled={initial ? !unlocked : false}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 outline-none"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(parseFloat(e.target.value || "0"))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Enter dollars and cents.</p>
            </div>

            {/* Due day */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Due day (1–28)</label>
              <input
                disabled={initial ? !unlocked : false}
                type="number"
                min={1}
                max={28}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value || "1", 10))}
              />
              <p className="text-xs text-slate-500 mt-1">
                The calendar day rent is due each month.
              </p>
            </div>

            {/* Security deposit */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Security deposit</label>
              <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
                <span className="px-2 py-2 text-slate-500">$</span>
                <input
                  disabled={initial ? !unlocked : false}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 outline-none"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(parseFloat(e.target.value || "0"))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Required. Use $0.00 if none.</p>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Start date</label>
              <input
                disabled={initial ? !unlocked : false}
                type="date"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End date */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                End date (optional)
              </label>
              <input
                disabled={initial ? !unlocked : false}
                type="date"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Grace days */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Grace period (days)
              </label>
              <input
                disabled={initial ? !unlocked : false}
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={graceDays}
                onChange={(e) => setGraceDays(parseInt(e.target.value || "0", 10))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Extra days after the due date before the rent is considered late.
              </p>
            </div>

            {/* Late fee type */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Late fee type</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={lateFeeType}
                onChange={(e) => setLateFeeType(e.target.value as "flat" | "percent")}
              >
                <option value="flat">Flat $</option>
                <option value="percent">Percent %</option>
              </select>
            </div>

            {/* Late fee value */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Late fee value</label>
              <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
                <span className="px-2 py-2 text-slate-500">{lateFeeType === "flat" ? "$" : "%"}</span>
                <input
                  disabled={initial ? !unlocked : false}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 outline-none"
                  value={lateFeeValue}
                  onChange={(e) => setLateFeeValue(parseFloat(e.target.value || "0"))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {lateFeeType === "flat"
                  ? "Charge a fixed late fee in dollars."
                  : "Charge a percentage of the monthly rent."}
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
              <input
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                placeholder="e.g., pets allowed, parking, utilities"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Increases */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">Increases per year</h3>
                {(!initial || unlocked) && (
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() =>
                      setIncreases((arr) => [
                        ...arr,
                        { year: (arr.at(-1)?.year ?? 1) + 1, type: "percent", value: 3 },
                      ])
                    }
                  >
                    + Add increase
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {increases.length === 0 && (
                  <div className="text-sm text-slate-500">No increases configured.</div>
                )}
                {increases.map((inc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 w-24">Year {inc.year}</span>
                    <select
                      disabled={initial ? !unlocked : false}
                      className="rounded border border-slate-300 px-2 py-1"
                      value={inc.type}
                      onChange={(e) => {
                        const t = e.target.value as "flat" | "percent";
                        setIncreases((arr) =>
                          arr.map((it, i) => (i === idx ? { ...it, type: t } : it))
                        );
                      }}
                    >
                      <option value="flat">Flat $</option>
                      <option value="percent">Percent %</option>
                    </select>
                    <input
                      disabled={initial ? !unlocked : false}
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-28 rounded border border-slate-300 px-2 py-1"
                      value={inc.value}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value || "0");
                        setIncreases((arr) =>
                          arr.map((it, i) => (i === idx ? { ...it, value: v } : it))
                        );
                      }}
                    />
                    {(!initial || unlocked) && (
                      <button
                        className="text-slate-500 hover:underline text-sm"
                        onClick={() =>
                          setIncreases((arr) => arr.filter((_, i) => i !== idx))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Computed schedule */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Period & amount</h3>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left p-2">Period</th>
                      <th className="text-left p-2">Monthly rent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.length === 0 && (
                      <tr>
                        <td className="p-2 text-slate-500" colSpan={2}>
                          Enter start/end dates and rent to preview schedule.
                        </td>
                      </tr>
                    )}
                    {schedule.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-2">{row.period}</td>
                        <td className="p-2">{money(row.rent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-2 p-4 border-t">
          <div className="text-sm text-slate-500">
            {initial ? (initial.locked && !unlocked ? "Locked" : "Unlocked") : "New lease"}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              disabled={!canSave}
              className={`px-4 py-2 rounded text-white ${
                canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
              }`}
              onClick={saveLease}
            >
              {initial ? "Save changes" : "Create lease"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
