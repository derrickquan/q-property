// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import { load, save } from "../lib/storage";

/** Local types kept simple to avoid type drift with lib/types */
type ID = string;
type LeaseStatus = "active" | "ended" | "pending";

type Property = {
  id: ID;
  name: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  unitCount?: number;
  type?: "residential" | "commercial";
  notes?: string;
};

type Tenant = {
  id: ID;
  firstName?: string;
  lastName?: string;
  fullName?: string; // optional — we derive name if missing
  email?: string;
  phone?: string;
  propertyId?: ID;
  unitLabel?: string;
  notes?: string;
};

type Increase = { year: number; type: "flat" | "percent"; value: number };
type Lease = {
  id: ID;
  tenantId: ID;
  propertyId: ID;

  monthlyRent: number; // dollars
  dueDay: number; // 1..28
  securityDeposit: number; // dollars

  startDate: string; // yyyy-mm-dd
  endDate?: string;  // yyyy-mm-dd

  graceDays: number; // days
  lateFeeType: "flat" | "percent";
  lateFeeValue: number; // dollars or percent

  increases?: Increase[]; // base/option combined; applied at the start of given year index

  status: LeaseStatus;
  notes?: string;

  locked?: boolean;
};

/* ---------- tiny utils ---------- */
const money = (n: number) =>
  (isNaN(n) ? 0 : n).toLocaleString(undefined, { style: "currency", currency: "USD" });

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");

const fullName = (t?: Tenant) => {
  if (!t) return "—";
  if (t.fullName && t.fullName.trim()) return t.fullName.trim();
  const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (t.email) {
    const local = t.email.split("@")[0];
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map(w => w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return "—";
};

/** Build “period” rows with real date ranges */
function buildSchedule(lease: Lease) {
  const rows: Array<{ period: string; rent: number }> = [];
  const start = new Date(lease.startDate);
  if (isNaN(start.getTime())) return rows;

  const end = lease.endDate ? new Date(lease.endDate) : undefined;

  // total years to show
  let totalYears = 1;
  if (end && end > start) {
    totalYears = end.getFullYear() - start.getFullYear() + 1;
  }

  // map increases by year index (2 = second year, etc.)
  const incMap = new Map<number, Increase>();
  (lease.increases || []).forEach(i => incMap.set(i.year, i));

  let rent = lease.monthlyRent;

  for (let yearIdx = 1; yearIdx <= totalYears; yearIdx++) {
    // apply increase AT the start of this year (except year 1)
    if (yearIdx > 1 && incMap.has(yearIdx)) {
      const inc = incMap.get(yearIdx)!;
      rent = inc.type === "flat" ? rent + inc.value : rent * (1 + inc.value / 100);
    }

    const s = new Date(start);
    s.setFullYear(start.getFullYear() + (yearIdx - 1));

    const e = new Date(s);
    e.setFullYear(s.getFullYear() + 1);
    e.setDate(e.getDate() - 1);

    // clamp to lease end
    const periodEnd = end && e > end ? end : e;

    const label = `${s.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}`;
    rows.push({ period: label, rent: Math.round(rent * 100) / 100 });

    if (end && periodEnd.getTime() === end.getTime()) break;
  }

  return rows;
}

/** Seed data if empty */
function seedIfEmpty() {
  const props = load<Property[]>("properties", []);
  if (!props || props.length === 0) {
    const seededProps: Property[] = [
      {
        id: "mock1",
        name: "Maplewood Apartments",
        address1: "1234 Elm Street",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
        unitCount: 12,
        type: "residential",
        notes: "Sample data",
      },
      {
        id: "mock2",
        name: "Sunset Plaza Retail",
        address1: "89 Sunset Blvd",
        city: "West Hollywood",
        state: "CA",
        zip: "90069",
        unitCount: 3,
        type: "commercial",
        notes: "Sample data",
      },
      {
        id: "mock3",
        name: "Cedar Fourplex",
        address1: "22 Cedar Ave",
        city: "Pasadena",
        state: "CA",
        zip: "91101",
        unitCount: 4,
        type: "residential",
        notes: "Sample data",
      },
    ];
    save("properties", seededProps);
  }

  const ts = load<Tenant[]>("tenants", []);
  if (!ts || ts.length === 0) {
    const seededTenants: Tenant[] = [
      { id: "t1", firstName: "Elliot", lastName: "Nguyen", email: "elliot@example.com" },
      { id: "t2", firstName: "Brianna", lastName: "Lopez", email: "brianna@example.com" },
      { id: "t3", firstName: "Chris", lastName: "Patel", email: "chris@example.com" },
      { id: "t4", firstName: "Elliot", lastName: "Kim", email: "elliot.kim@example.com" },
      { id: "t5", firstName: "Rhea", lastName: "Singh", email: "rhea@example.com" },
    ];
    save("tenants", seededTenants);
  }

  const ls = load<Lease[]>("leases", []);
  if (!ls || ls.length === 0) {
    const tenants = load<Tenant[]>("tenants", []);
    const propsNow = load<Property[]>("properties", []);
    const elliot = tenants.find(t => t.firstName?.toLowerCase() === "elliot" && t.lastName?.toLowerCase() === "nguyen");
    const prop = propsNow[0];

    if (elliot && prop) {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + 2);

      const demo: Lease = {
        id: "lease-demo-elliot",
        tenantId: elliot.id,
        propertyId: prop.id,
        monthlyRent: 2450,
        dueDay: 1,
        securityDeposit: 5000,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        graceDays: 3,
        lateFeeType: "flat",
        lateFeeValue: 50,
        increases: [
          { year: 2, type: "percent", value: 3 },
          { year: 3, type: "percent", value: 3 },
        ],
        status: "active",
        notes: "Seeded example lease with option-like increases.",
        locked: true,
      };
      save("leases", [demo]);
    }
  }
}

/* ---------------- Page ---------------- */
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
    const byT = new Map(tenants.map(t => [t.id, t]));
    const byP = new Map(properties.map(p => [p.id, p]));
    return (leases || []).map(l => {
      const t = byT.get(l.tenantId);
      const p = byP.get(l.propertyId);
      const propLabel = p ? `${p.name}${p.city ? ` — ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}` : "—";
      return {
        id: l.id,
        tenant: fullName(t),
        property: propLabel,
        monthly: money(l.monthlyRent),
        dueDay: l.dueDay,
        start: fmtDate(l.startDate),
        end: fmtDate(l.endDate),
        status: l.status[0].toUpperCase() + l.status.slice(1),
      };
    });
  }, [leases, tenants, properties]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* no page-level header here; global navbar lives in _app.tsx */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Leases</h1>
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
            {rows.map(r => (
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
                      const l = (leases || []).find(x => x.id === r.id) || null;
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
                      const next = (leases || []).filter(x => x.id !== r.id);
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
          initial={editing}
          tenants={tenants}
          properties={properties}
          onClose={() => setShowModal(false)}
          onSaved={(lease) => {
            // AUTO-LOCK on save
            const locked: Lease = { ...lease, locked: true };
            const list = load<Lease[]>("leases", []);
            const i = list.findIndex(l => l.id === locked.id);
            const next = i >= 0 ? [...list.slice(0, i), locked, ...list.slice(i + 1)] : [...list, locked];
            save("leases", next);
            setLeases(next);
            setShowModal(false);
          }}
        />
      )}
    </main>
  );
}

/* ---------------- Modal ---------------- */
function LeaseModal({
  initial,
  tenants,
  properties,
  onClose,
  onSaved,
}: {
  initial: Lease | null;
  tenants: Tenant[];
  properties: Property[];
  onClose: () => void;
  onSaved: (l: Lease) => void;
}) {
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
  const [status, setStatus] = useState<LeaseStatus>(initial?.status ?? "active");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [increases, setIncreases] = useState<Increase[]>(initial?.increases ?? []);

  // lock state: existing leases start locked; require unlock to edit
  const [unlocked, setUnlocked] = useState<boolean>(!initial?.locked);

  const schedule = useMemo(
    () =>
      buildSchedule({
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
        increases,
        status,
        notes,
        locked: initial?.locked ?? false,
      }),
    [
      initial?.id,
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
      increases,
      status,
      notes,
      initial?.locked,
    ]
  );

  const canSave =
    unlocked &&
    tenantId &&
    propertyId &&
    monthlyRent >= 0 &&
    dueDay >= 1 &&
    dueDay <= 28 &&
    !!startDate;

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
      increases,
      status,
      notes,
      locked: true, // auto-lock
    };
    onSaved(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white w-full max-w-5xl rounded-lg shadow-lg max-h-[92vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{initial ? "Lease details" : "Add lease"}</h2>
          <button className="text-slate-600 hover:text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>

        {/* body (scrollable) */}
        <div className="p-4 overflow-y-auto">
          {initial && (
            <div className="mb-4 flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {initial.locked && !unlocked
                  ? "This lease is locked. Unlock to edit."
                  : "Lease is unlocked. You can edit fields below."}
              </span>
              <button
                className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
                onClick={() => setUnlocked(v => !v)}
              >
                {initial.locked && !unlocked ? "Unlock" : "Lock"}
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tenant */}
            <div>
              <label className="block text-sm font-medium">Tenant</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={tenantId}
                onChange={e => setTenantId(e.target.value)}
              >
                <option value="">— Select tenant —</option>
                {tenants
                  .slice()
                  .sort((a, b) => fullName(a).localeCompare(fullName(b)))
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {fullName(t)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Property */}
            <div>
              <label className="block text-sm font-medium">Property</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
              >
                <option value="">— Select property —</option>
                {properties
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {`${p.name}${p.city ? ` — ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}`}
                    </option>
                  ))}
              </select>
            </div>

            {/* Monthly rent */}
            <div>
              <label className="block text-sm font-medium">Monthly rent</label>
              <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
                <span className="px-2 py-2 text-slate-500">$</span>
                <input
                  disabled={initial ? !unlocked : false}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 outline-none"
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(parseFloat(e.target.value || "0"))}
                />
              </div>
            </div>

            {/* Due day */}
            <div>
              <label className="block text-sm font-medium">Due day (1–28)</label>
              <input
                disabled={initial ? !unlocked : false}
                type="number"
                min={1}
                max={28}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={dueDay}
                onChange={e => setDueDay(parseInt(e.target.value || "1", 10))}
              />
            </div>

            {/* Security deposit */}
            <div>
              <label className="block text-sm font-medium">Security deposit</label>
              <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
                <span className="px-2 py-2 text-slate-500">$</span>
                <input
                  disabled={initial ? !unlocked : false}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full px-3 py-2 outline-none"
                  value={securityDeposit}
                  onChange={e => setSecurityDeposit(parseFloat(e.target.value || "0"))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Required — use $0.00 if none.</p>
            </div>

            {/* Start/End on same row */}
            <div>
              <label className="block text-sm font-medium">Start date</label>
              <input
                disabled={initial ? !unlocked : false}
                type="date"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End date (optional)</label>
              <input
                disabled={initial ? !unlocked : false}
                type="date"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            {/* Grace + Late fee on same row */}
            <div>
              <label className="block text-sm font-medium">Grace period (days)</label>
              <input
                disabled={initial ? !unlocked : false}
                type="number"
                min={0}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={graceDays}
                onChange={e => setGraceDays(parseInt(e.target.value || "0", 10))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Extra days after the due date before rent is considered late.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">Late fee</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  disabled={initial ? !unlocked : false}
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={lateFeeType}
                  onChange={e => setLateFeeType(e.target.value as "flat" | "percent")}
                >
                  <option value="flat">Flat $</option>
                  <option value="percent">Percent %</option>
                </select>
                <div className="mt-1 flex rounded border border-slate-300 overflow-hidden">
                  <span className="px-2 py-2 text-slate-500">
                    {lateFeeType === "flat" ? "$" : "%"}
                  </span>
                  <input
                    disabled={initial ? !unlocked : false}
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 outline-none"
                    value={lateFeeValue}
                    onChange={e => setLateFeeValue(parseFloat(e.target.value || "0"))}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Notes (optional)</label>
              <input
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Status</label>
              <select
                disabled={initial ? !unlocked : false}
                className="mt-1 w-full max-w-xs rounded border border-slate-300 px-3 py-2"
                value={status}
                onChange={e => setStatus(e.target.value as LeaseStatus)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Increases */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Increases per year</h3>
                {(!initial || unlocked) && (
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() =>
                      setIncreases(arr => [
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
                      onChange={e =>
                        setIncreases(arr =>
                          arr.map((it, i) => (i === idx ? { ...it, type: e.target.value as any } : it))
                        )
                      }
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
                      onChange={e =>
                        setIncreases(arr =>
                          arr.map((it, i) => (i === idx ? { ...it, value: parseFloat(e.target.value || "0") } : it))
                        )
                      }
                    />
                    {(!initial || unlocked) && (
                      <button
                        className="text-slate-500 hover:underline text-sm"
                        onClick={() => setIncreases(arr => arr.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule preview */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium mb-2">Period & amount</h3>
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
            <button className="px-3 py-2 rounded border border-slate-300 hover:bg-slate-50" onClick={onClose}>
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
