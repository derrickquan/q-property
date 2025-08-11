// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { load, save } from "../lib/storage";

/* ===================== Minimal types ===================== */
type ID = string;
type UnitType = "residential" | "commercial";
type LeaseStatus = "active" | "ended" | "pending";

type Property = {
  id: ID;
  name: string;
  city?: string;
  state?: string;
  address1?: string;
  unitCount?: number;
  type?: UnitType;
  notes?: string;
};

type Tenant = {
  id: ID;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  propertyId?: ID;
  unit?: string;
  notes?: string;
};

type Lease = {
  id: ID;
  tenantId: ID;
  propertyId: ID;

  monthlyRentCents: number;
  dueDay: number; // 1..28
  startDate: string; // ISO
  endDate?: string; // ISO

  securityDepositCents: number;
  graceDays: number;
  lateFeeMode: "flat" | "percent";
  lateFeeValue: number; // cents if flat, % if percent

  annualMode: "flat" | "percent";
  annualValue: number; // cents if flat, % if percent

  withOptions?: boolean;
  optionYears?: number;
  optionIncreaseMode?: "flat" | "percent";
  optionIncreaseValue?: number; // cents if flat, % if percent

  notes?: string;
  status: LeaseStatus;

  locked?: boolean; // when true, must unlock before editing
};

/* ===================== Demo fallbacks ===================== */
const DEMO_PROPERTIES: Property[] = [
  { id: "mock1", name: "Maplewood Apartments", city: "Los Angeles", state: "CA", unitCount: 12, type: "residential" },
  { id: "mock2", name: "Sunset Plaza Retail", city: "San Diego", state: "CA", unitCount: 3, type: "commercial" },
  { id: "mock3", name: "Cedar Fourplex", city: "Sacramento", state: "CA", unitCount: 4, type: "residential" },
];

const DEMO_TENANTS: Tenant[] = [
  { id: "t1", firstName: "Alex", lastName: "Nguyen", email: "alex@example.com" },
  { id: "t2", firstName: "Brianna", lastName: "Lopez", email: "brianna@example.com" },
  { id: "t3", firstName: "Chris", lastName: "Patel", email: "chris.patel@example.com" },
  { id: "t4", firstName: "Elliot", lastName: "Nguyen", email: "elliot@example.com" },
  { id: "t5", firstName: "Rhea", lastName: "Singh", email: "rhea@example.com" },
];

/* ===================== Helpers ===================== */
const moneyToCents = (v: string | number) => {
  const n =
    typeof v === "number" ? v : parseFloat((v || "0").toString().replace(/[^\d.]/g, ""));
  return Math.round((isNaN(n) ? 0 : n) * 100);
};
const centsToMoney = (cents: number) =>
  (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const pickTenantName = (t?: Tenant) => {
  if (!t) return "—";
  const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (t.fullName?.trim()) return t.fullName.trim();
  if (t.email) {
    const local = t.email.split("@")[0] || "";
    const words = local.split(/[._-]+/).filter(Boolean);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || "—";
  }
  return "—";
};

const pickPropertyLabel = (p?: Property) =>
  p ? `${p.name}${p.city ? ` — ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}` : "—";

const yearsBetween = (startISO: string, endISO?: string) => {
  if (!startISO) return 1;
  if (!endISO) return 1;
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 1;
  let years = e.getFullYear() - s.getFullYear();
  const afterAnniversary =
    e.getMonth() > s.getMonth() ||
    (e.getMonth() === s.getMonth() && e.getDate() >= s.getDate());
  return years + (afterAnniversary ? 1 : 0);
};
const addYear = (d: Date, n: number) => {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + n);
  return x;
};
const inc = (base: number, mode: "flat" | "percent", value: number) =>
  mode === "flat" ? base + value : Math.round(base * (1 + value / 100));

/* ===================== Components ===================== */
export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [detailLease, setDetailLease] = useState<Lease | null>(null);

  // bootstrap
  useEffect(() => {
    const ts = load<Tenant[]>("tenants", []);
    const ps = load<Property[]>("properties", []);
    const ls = load<Lease[]>("leases", []);

    setTenants(ts.length ? ts : DEMO_TENANTS);
    setProperties(ps.length ? ps : DEMO_PROPERTIES);

    if (ls.length) {
      setLeases(ls);
      return;
    }

    // Seed a default lease for Elliot (with options) if none exist
    const elliot =
      (ts.find(t => (t.firstName?.toLowerCase() === "elliot") && (t.lastName?.toLowerCase() === "nguyen")) ??
       DEMO_TENANTS.find(t => t.email === "elliot@example.com")) || DEMO_TENANTS[3];
    const prop = (ps[0] ?? DEMO_PROPERTIES[0]);

    const seeded: Lease = {
      id: "seed_elliot",
      tenantId: elliot.id,
      propertyId: prop.id,
      monthlyRentCents: moneyToCents(2450),
      dueDay: 1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: addYear(new Date(), 2).toISOString().slice(0, 10),

      securityDepositCents: moneyToCents(5000),
      graceDays: 3,
      lateFeeMode: "flat",
      lateFeeValue: moneyToCents(50),

      annualMode: "percent",
      annualValue: 3,

      withOptions: true,
      optionYears: 2,
      optionIncreaseMode: "percent",
      optionIncreaseValue: 3,

      notes: "Seeded example lease with option years.",
      status: "active",
      locked: true,
    };

    save("leases", [seeded]);
    setLeases([seeded]);
  }, []);

  const byTenant = useMemo(() => {
    const m = new Map<ID, Tenant>();
    tenants.forEach(t => m.set(t.id, t));
    return m;
  }, [tenants]);
  const byProperty = useMemo(() => {
    const m = new Map<ID, Property>();
    properties.forEach(p => m.set(p.id, p));
    return m;
  }, [properties]);

  const rows = useMemo(
    () =>
      leases
        .map(l => ({
          ...l,
          tenantName: pickTenantName(byTenant.get(l.tenantId)),
          propertyLabel: pickPropertyLabel(byProperty.get(l.propertyId)),
        }))
        .sort((a, b) => a.tenantName.localeCompare(b.tenantName)),
    [leases, byTenant, byProperty]
  );

  const openDetails = (l: Lease) => setDetailLease(l);
  const closeDetails = () => setDetailLease(null);

  const handleCreate = (newLease: Lease) => {
    const next = [...leases, newLease];
    setLeases(next);
    save("leases", next);
    setOpenAdd(false);
  };

  const handleUpdate = (updated: Lease) => {
    const next = leases.map(l => (l.id === updated.id ? updated : l));
    setLeases(next);
    save("leases", next);
    setDetailLease(updated);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold">Q Property</Link>
          <div className="hidden sm:flex gap-4 text-slate-600">
            <Link href="/properties" className="hover:text-slate-900">Properties</Link>
            <Link href="/tenants" className="hover:text-slate-900">Tenants</Link>
            <span className="text-slate-900 font-medium">Leases</span>
            <Link href="/statements" className="hover:text-slate-900">Statements</Link>
          </div>
          <button
            className="ml-auto px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setOpenAdd(true)}
          >
            Add lease
          </button>
        </div>
      </nav>

      {/* Table */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Leases</h1>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Property</th>
                <th className="text-left p-3">Monthly rent</th>
                <th className="text-left p-3">Due day</th>
                <th className="text-left p-3">Start</th>
                <th className="text-left p-3">End</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={7}>
                    No leases yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => openDetails(r)}
                >
                  <td className="p-3">{r.tenantName}</td>
                  <td className="p-3">{r.propertyLabel}</td>
                  <td className="p-3">{centsToMoney(r.monthlyRentCents)}</td>
                  <td className="p-3">{r.dueDay}</td>
                  <td className="p-3">{new Date(r.startDate).toLocaleDateString()}</td>
                  <td className="p-3">{r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openAdd && (
        <AddLeaseModal
          tenants={tenants.length ? tenants : DEMO_TENANTS}
          properties={properties.length ? properties : DEMO_PROPERTIES}
          onClose={() => setOpenAdd(false)}
          onCreate={handleCreate}
        />
      )}

      {detailLease && (
        <LeaseDetailsModal
          lease={detailLease}
          tenant={byTenant.get(detailLease.tenantId)}
          property={byProperty.get(detailLease.propertyId)}
          onClose={closeDetails}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

/* ===================== Add Lease Modal (basic) ===================== */
function AddLeaseModal({
  tenants,
  properties,
  onClose,
  onCreate,
}: {
  tenants: Tenant[];
  properties: Property[];
  onClose: () => void;
  onCreate: (l: Lease) => void;
}) {
  const [tenantId, setTenantId] = useState<ID>("");
  const [propertyId, setPropertyId] = useState<ID>("");

  const [monthlyRent, setMonthlyRent] = useState("0");
  const [dueDay, setDueDay] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");

  const [securityDeposit, setSecurityDeposit] = useState("0");
  const [graceDays, setGraceDays] = useState(0);
  const [lateFeeMode, setLateFeeMode] = useState<"flat" | "percent">("flat");
  const [lateFeeValue, setLateFeeValue] = useState("0");

  const [annualMode, setAnnualMode] = useState<"flat" | "percent">("percent");
  const [annualValue, setAnnualValue] = useState("3");

  const [withOptions, setWithOptions] = useState(false);
  const [optionYears, setOptionYears] = useState(0);
  const [optionMode, setOptionMode] = useState<"flat" | "percent">("percent");
  const [optionValue, setOptionValue] = useState("3");

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeaseStatus>("active");

  const canCreate = tenantId && propertyId && moneyToCents(monthlyRent) > 0 && dueDay >= 1 && dueDay <= 28;

  const create = () => {
    if (!canCreate) return;
    const lease: Lease = {
      id: `lease_${Date.now()}`,
      tenantId,
      propertyId,
      monthlyRentCents: moneyToCents(monthlyRent),
      dueDay,
      startDate,
      endDate: endDate || undefined,
      securityDepositCents: moneyToCents(securityDeposit),
      graceDays,
      lateFeeMode,
      lateFeeValue: lateFeeMode === "flat" ? moneyToCents(lateFeeValue) : parseFloat(lateFeeValue || "0"),
      annualMode,
      annualValue: annualMode === "flat" ? moneyToCents(annualValue) : parseFloat(annualValue || "0"),
      withOptions,
      optionYears: withOptions ? optionYears : undefined,
      optionIncreaseMode: withOptions ? optionMode : undefined,
      optionIncreaseValue: withOptions
        ? optionMode === "flat"
          ? moneyToCents(optionValue)
          : parseFloat(optionValue || "0")
        : undefined,
      notes: notes || undefined,
      status,
      locked: true, // newly created leases start locked
    };
    onCreate(lease);
  };

  const sortedTenants = useMemo(
    () => tenants.slice().sort((a, b) => pickTenantName(a).localeCompare(pickTenantName(b))),
    [tenants]
  );
  const sortedProps = useMemo(
    () => properties.slice().sort((a, b) => pickPropertyLabel(a).localeCompare(pickPropertyLabel(b))),
    [properties]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add lease</h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">Close</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {/* tenant & property */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tenant</label>
              <select className="w-full rounded border-slate-300" value={tenantId} onChange={e => setTenantId(e.target.value)}>
                <option value="">— Select tenant —</option>
                {sortedTenants.map(t => (
                  <option key={t.id} value={t.id}>{pickTenantName(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Property</label>
              <select className="w-full rounded border-slate-300" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                <option value="">— Select property —</option>
                {sortedProps.map(p => (
                  <option key={p.id} value={p.id}>{pickPropertyLabel(p)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* money row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monthly rent</label>
              <div className="flex">
                <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">$</span>
                <input className="w-full rounded-r border-slate-300" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due day (1–28)</label>
              <input type="number" min={1} max={28} className="w-full rounded border-slate-300" value={dueDay} onChange={e => setDueDay(parseInt(e.target.value || "1", 10))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Security deposit</label>
              <div className="flex">
                <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">$</span>
                <input className="w-full rounded-r border-slate-300" value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} />
              </div>
            </div>
          </div>

          {/* dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start date</label>
              <input type="date" className="w-full rounded border-slate-300" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End date (optional)</label>
              <input type="date" className="w-full rounded border-slate-300" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* grace + late fees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Grace period (days)</label>
              <input type="number" className="w-full rounded border-slate-300" min={0} value={graceDays} onChange={e => setGraceDays(Math.max(0, parseInt(e.target.value || "0", 10)))} />
              <p className="text-xs text-slate-500 mt-1">Extra days after the due date before rent is considered late.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Late fee type</label>
                <select className="w-full rounded border-slate-300" value={lateFeeMode} onChange={e => setLateFeeMode(e.target.value as any)}>
                  <option value="flat">Flat $</option>
                  <option value="percent">Percent %</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Late fee value</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">{lateFeeMode === "flat" ? "$" : "%"}</span>
                  <input className="w-full rounded-r border-slate-300" value={lateFeeValue} onChange={e => setLateFeeValue(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* annual/option */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">Annual increase (base term)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full rounded border-slate-300" value={annualMode} onChange={e => setAnnualMode(e.target.value as any)}>
                  <option value="percent">Percent %</option>
                  <option value="flat">Flat $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <div className="flex">
                  <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">{annualMode === "flat" ? "$" : "%"}</span>
                  <input className="w-full rounded-r border-slate-300" value={annualValue} onChange={e => setAnnualValue(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={withOptions} onChange={e => setWithOptions(e.target.checked)} />
              <span className="text-sm font-medium">Include option years</span>
            </label>
            {withOptions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1"># of option years</label>
                  <input type="number" min={1} className="w-full rounded border-slate-300" value={optionYears} onChange={e => setOptionYears(Math.max(0, parseInt(e.target.value || "0", 10)))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option type</label>
                  <select className="w-full rounded border-slate-300" value={optionMode} onChange={e => setOptionMode(e.target.value as any)}>
                    <option value="percent">Percent %</option>
                    <option value="flat">Flat $</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Option value</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">{optionMode === "flat" ? "$" : "%"}</span>
                    <input className="w-full rounded-r border-slate-300" value={optionValue} onChange={e => setOptionValue(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <input className="w-full rounded border-slate-300" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="w-full rounded border-slate-300" value={status} onChange={e => setStatus(e.target.value as LeaseStatus)}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button
            onClick={create}
            disabled={!canCreate}
            className={`px-4 py-2 rounded text-white ${canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300"}`}
          >
            Create lease
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== Lease Details (clickable row) ===================== */
function LeaseDetailsModal({
  lease,
  tenant,
  property,
  onClose,
  onSave,
}: {
  lease: Lease;
  tenant?: Tenant;
  property?: Property;
  onClose: () => void;
  onSave: (l: Lease) => void;
}) {
  const [local, setLocal] = useState<Lease>({ ...lease });
  const [edit, setEdit] = useState<boolean>(false);

  useEffect(() => {
    setLocal({ ...lease });
    setEdit(false);
  }, [lease.id]);

  const toggleLock = () => {
    const next = { ...local, locked: !local.locked };
    setLocal(next);
  };

  const canSave = edit && !local.locked;

  // simple schedule preview
  const schedule = useMemo(() => {
    const items: { year: number; monthly: number }[] = [];
    const baseYears = yearsBetween(local.startDate, local.endDate);
    let m = local.monthlyRentCents;

    for (let y = 0; y < baseYears; y++) {
      items.push({ year: y + 1, monthly: m });
      m = inc(m, local.annualMode, local.annualValue);
    }
    if (local.withOptions && (local.optionYears || 0) > 0) {
      for (let i = 0; i < (local.optionYears || 0); i++) {
        items.push({ year: baseYears + i + 1, monthly: m });
        m = inc(m, local.optionIncreaseMode || "percent", local.optionIncreaseValue || 0);
      }
    }
    return items;
  }, [local]);

  const set = <K extends keyof Lease>(k: K, v: Lease[K]) => setLocal((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Lease details</h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">Close</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-2 py-1 rounded bg-slate-100 text-slate-700">
              <span className="font-medium">Tenant:</span> {pickTenantName(tenant)}
            </div>
            <div className="px-2 py-1 rounded bg-slate-100 text-slate-700">
              <span className="font-medium">Property:</span> {pickPropertyLabel(property)}
            </div>
            <div className={`px-2 py-1 rounded ${local.locked ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
              {local.locked ? "Locked" : "Unlocked"}
            </div>
            <button
              onClick={toggleLock}
              className={`ml-auto px-3 py-1 rounded border ${
                local.locked ? "border-amber-300 text-amber-700" : "border-emerald-300 text-emerald-700"
              }`}
            >
              {local.locked ? "Unlock" : "Lock"}
            </button>
            <button
              onClick={() => setEdit((e) => !e)}
              disabled={local.locked}
              className={`px-3 py-1 rounded ${local.locked ? "bg-slate-200 text-slate-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              {edit ? "Stop editing" : "Edit"}
            </button>
          </div>

          {/* editable bits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldMoney
              label="Monthly rent"
              value={local.monthlyRentCents}
              onChange={(c) => set("monthlyRentCents", c)}
              disabled={!edit || local.locked}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Due day (1–28)</label>
              <input
                type="number"
                min={1}
                max={28}
                className="w-full rounded border-slate-300"
                disabled={!edit || local.locked}
                value={local.dueDay}
                onChange={(e) => set("dueDay", Math.min(28, Math.max(1, parseInt(e.target.value || "1", 10))))}
              />
            </div>
            <FieldMoney
              label="Security deposit"
              value={local.securityDepositCents}
              onChange={(c) => set("securityDepositCents", c)}
              disabled={!edit || local.locked}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start date</label>
              <input
                type="date"
                className="w-full rounded border-slate-300"
                disabled={!edit || local.locked}
                value={local.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End date (optional)</label>
              <input
                type="date"
                className="w-full rounded border-slate-300"
                disabled={!edit || local.locked}
                value={local.endDate || ""}
                onChange={(e) => set("endDate", e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Grace days</label>
              <input
                type="number"
                min={0}
                className="w-full rounded border-slate-300"
                disabled={!edit || local.locked}
                value={local.graceDays}
                onChange={(e) => set("graceDays", Math.max(0, parseInt(e.target.value || "0", 10)))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Late fee type</label>
                <select
                  className="w-full rounded border-slate-300"
                  disabled={!edit || local.locked}
                  value={local.lateFeeMode}
                  onChange={(e) => set("lateFeeMode", e.target.value as any)}
                >
                  <option value="flat">Flat $</option>
                  <option value="percent">Percent %</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Late fee value</label>
                <input
                  className="w-full rounded border-slate-300"
                  disabled={!edit || local.locked}
                  value={
                    local.lateFeeMode === "flat"
                      ? (local.lateFeeValue / 100).toFixed(2)
                      : String(local.lateFeeValue)
                  }
                  onChange={(e) =>
                    set(
                      "lateFeeValue",
                      local.lateFeeMode === "flat" ? moneyToCents(e.target.value) : parseFloat(e.target.value || "0")
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Annual increase type</label>
              <select
                className="w-full rounded border-slate-300"
                disabled={!edit || local.locked}
                value={local.annualMode}
                onChange={(e) => set("annualMode", e.target.value as any)}
              >
                <option value="percent">Percent %</option>
                <option value="flat">Flat $</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Annual increase value</label>
              <input
                className="w-full rounded border-slate-300"
                disabled={!edit || local.locked}
                value={
                  local.annualMode === "flat"
                    ? (local.annualValue / 100).to
