// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { load, save } from "../lib/storage";

/** ========= Local types (kept minimal & flexible) ========= */
type ID = string;

type UnitType = "residential" | "commercial";

type PropertyLite = {
  id: ID;
  name: string;
  address1?: string;
  city?: string;
  state?: string;
  unitCount?: number;
  type?: UnitType;
  notes?: string;
};

type TenantLite = {
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

type LeaseStatus = "active" | "ended" | "pending";

/** We keep this local so we don't depend on ../lib/types export shape */
type LeaseRecord = {
  id: ID;
  tenantId: ID;
  propertyId: ID;
  monthlyRentCents: number; // store money in cents to avoid float drama
  dueDay: number; // 1..28
  startDate: string; // ISO date
  endDate?: string; // ISO date or undefined
  securityDepositCents: number;
  graceDays: number;
  lateFeeMode: "flat" | "percent";
  lateFeeValue: number; // cents if flat, percent as whole number (e.g. 5 = 5%)
  notes?: string;
  status: LeaseStatus;

  // Optional term controls (option years):
  withOptions?: boolean;
  optionYears?: number;
  optionIncreaseMode?: "flat" | "percent";
  optionIncreaseValue?: number; // cents or percent like above
};

/** ========= Helpers ========= */
const moneyToCents = (v: string | number) => {
  const num =
    typeof v === "number" ? v : parseFloat(v.replace(/[^\d.]/g, "") || "0");
  return Math.round(num * 100);
};
const centsToMoney = (cents: number) =>
  (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pickTenantName = (t: TenantLite) => {
  if (!t) return "—";
  if (t.fullName && t.fullName.trim()) return t.fullName.trim();
  const parts = [t.firstName?.trim(), t.lastName?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return t.email || "—";
};

const pickPropertyLabel = (p: PropertyLite) => {
  if (!p) return "—";
  const loc =
    p.city && p.state ? ` — ${p.city}, ${p.state}` : p.city ? ` — ${p.city}` : "";
  return `${p.name}${loc}`;
};

const yearsBetween = (startISO: string, endISO?: string) => {
  if (!endISO) return 1;
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (e <= s) return 1;
  // Count anniversaries (inclusive start year)
  let years = e.getFullYear() - s.getFullYear();
  const afterAnniversary =
    e.getMonth() > s.getMonth() ||
    (e.getMonth() === s.getMonth() && e.getDate() >= s.getDate());
  return years + (afterAnniversary ? 1 : 0);
};

function addYear(d: Date, n: number) {
  const copy = new Date(d);
  copy.setFullYear(copy.getFullYear() + n);
  return copy;
}

/** ========= Page ========= */
export default function LeasesPage() {
  const [leases, setLeases] = useState<LeaseRecord[]>([]);
  const [tenants, setTenants] = useState<TenantLite[]>([]);
  const [properties, setProperties] = useState<PropertyLite[]>([]);
  const [open, setOpen] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    setLeases(load<LeaseRecord[]>("leases", []));
    setTenants(load<TenantLite[]>("tenants", []));
    setProperties(load<PropertyLite[]>("properties", []));
  }, []);

  const byTenant = useMemo(() => {
    const m = new Map<ID, TenantLite>();
    tenants.forEach((t) => m.set(t.id, t));
    return m;
  }, [tenants]);

  const byProperty = useMemo(() => {
    const m = new Map<ID, PropertyLite>();
    properties.forEach((p) => m.set(p.id, p));
    return m;
  }, [properties]);

  const rows = useMemo(
    () =>
      leases
        .map((l) => ({
          ...l,
          tenantLabel: pickTenantName(byTenant.get(l.tenantId)!),
          propertyLabel: pickPropertyLabel(byProperty.get(l.propertyId)!),
        }))
        .sort((a, b) => a.tenantLabel.localeCompare(b.tenantLabel)),
    [leases, byTenant, byProperty]
  );

  const handleCreate = (newLease: LeaseRecord) => {
    const next = [...leases, newLease];
    setLeases(next);
    save("leases", next);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Q Property
          </Link>
          <div className="hidden sm:flex gap-4 text-slate-600">
            <Link href="/properties" className="hover:text-slate-900">
              Properties
            </Link>
            <Link href="/tenants" className="hover:text-slate-900">
              Tenants
            </Link>
            <span className="text-slate-900 font-medium">Leases</span>
            <Link href="/statements" className="hover:text-slate-900">
              Statements
            </Link>
          </div>
          <button
            className="ml-auto px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setOpen(true)}
          >
            Add lease
          </button>
        </div>
      </nav>

      {/* Content */}
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
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3">{r.tenantLabel}</td>
                  <td className="p-3">{r.propertyLabel}</td>
                  <td className="p-3">{centsToMoney(r.monthlyRentCents)}</td>
                  <td className="p-3">{r.dueDay}</td>
                  <td className="p-3">
                    {new Date(r.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <AddLeaseModal
          tenants={tenants}
          properties={properties}
          onClose={() => setOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

/** ========= Add Lease Modal ========= */

type AddLeaseModalProps = {
  tenants: TenantLite[];
  properties: PropertyLite[];
  onClose: () => void;
  onCreate: (l: LeaseRecord) => void;
};

function AddLeaseModal({
  tenants,
  properties,
  onClose,
  onCreate,
}: AddLeaseModalProps) {
  const [tenantId, setTenantId] = useState<ID>("");
  const [propertyId, setPropertyId] = useState<ID>("");

  const [monthlyRent, setMonthlyRent] = useState<string>("0");
  const [dueDay, setDueDay] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>("");

  const [securityDeposit, setSecurityDeposit] = useState<string>("0");
  const [graceDays, setGraceDays] = useState<number>(0);

  const [lateFeeMode, setLateFeeMode] = useState<"flat" | "percent">("flat");
  const [lateFeeValue, setLateFeeValue] = useState<string>("0");

  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<LeaseStatus>("active");

  // Option years
  const [withOptions, setWithOptions] = useState<boolean>(false);
  const [optionYears, setOptionYears] = useState<number>(0);
  const [annualMode, setAnnualMode] = useState<"flat" | "percent">("percent");
  const [annualValue, setAnnualValue] = useState<string>("3"); // 3% default
  const [optionMode, setOptionMode] = useState<"flat" | "percent">("percent");
  const [optionValue, setOptionValue] = useState<string>("3");

  // Build payment schedule preview
  const schedule = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date();
    const baseYears = yearsBetween(startDate, endDate);
    const monthly0 = moneyToCents(monthlyRent);

    const items: {
      year: number;
      periodStart: string;
      periodEnd?: string;
      monthlyCents: number;
    }[] = [];

    // helper to compute increased monthly
    const applyIncrease = (
      base: number,
      mode: "flat" | "percent",
      valueStr: string
    ) => {
      if (mode === "flat") {
        return base + moneyToCents(valueStr || "0");
      }
      const p = parseFloat(valueStr || "0"); // percent
      return Math.round(base * (1 + p / 100));
    };

    let currentMonthly = monthly0;

    // Base term years
    for (let y = 0; y < baseYears; y++) {
      const ps = addYear(start, y);
      const pe = endDate
        ? addYear(new Date(startDate), y + 1) > new Date(endDate)
          ? new Date(endDate)
          : addYear(start, y + 1)
        : undefined;

      items.push({
        year: y + 1,
        periodStart: ps.toISOString().slice(0, 10),
        periodEnd: pe ? pe.toISOString().slice(0, 10) : undefined,
        monthlyCents: currentMonthly,
      });

      // bump for next year
      currentMonthly = applyIncrease(currentMonthly, annualMode, annualValue);
    }

    if (withOptions && optionYears > 0) {
      for (let oy = 0; oy < optionYears; oy++) {
        const yearIndex = baseYears + oy + 1;
        const ps = addYear(start, baseYears + oy);
        const pe = addYear(start, baseYears + oy + 1);

        items.push({
          year: yearIndex,
          periodStart: ps.toISOString().slice(0, 10),
          periodEnd: pe.toISOString().slice(0, 10),
          monthlyCents: currentMonthly,
        });

        currentMonthly = applyIncrease(currentMonthly, optionMode, optionValue);
      }
    }

    return items;
  }, [
    startDate,
    endDate,
    monthlyRent,
    withOptions,
    optionYears,
    annualMode,
    annualValue,
    optionMode,
    optionValue,
  ]);

  const canCreate =
    tenantId &&
    propertyId &&
    moneyToCents(monthlyRent) > 0 &&
    dueDay >= 1 &&
    dueDay <= 28;

  const handleCreate = () => {
    if (!canCreate) return;

    const rec: LeaseRecord = {
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
      lateFeeValue:
        lateFeeMode === "flat"
          ? moneyToCents(lateFeeValue)
          : parseFloat(lateFeeValue || "0"),
      notes: notes || undefined,
      status,
      withOptions,
      optionYears: withOptions ? optionYears : undefined,
      optionIncreaseMode: withOptions ? optionMode : undefined,
      optionIncreaseValue: withOptions
        ? optionMode === "flat"
          ? moneyToCents(optionValue)
          : parseFloat(optionValue || "0")
        : undefined,
    };

    onCreate(rec);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop (non-clickable to avoid accidental close) */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add lease</h2>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Tenant & Property */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tenant</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full rounded border-slate-300"
              >
                <option value="">— Select tenant —</option>
                {tenants
                  .slice()
                  .sort((a, b) =>
                    pickTenantName(a).localeCompare(pickTenantName(b))
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {pickTenantName(t)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded border-slate-300"
              >
                <option value="">— Select property —</option>
                {properties
                  .slice()
                  .sort((a, b) =>
                    pickPropertyLabel(a).localeCompare(pickPropertyLabel(b))
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {pickPropertyLabel(p)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Money + Due */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly rent
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                  $
                </span>
                <input
                  inputMode="decimal"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full rounded-r border-slate-300"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter dollars and cents.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Due day (1–28)
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value || "1", 10))}
                className="w-full rounded border-slate-300"
              />
              <p className="text-xs text-slate-500 mt-1">
                The calendar day rent is due each month.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Security deposit
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                  $
                </span>
                <input
                  inputMode="decimal"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full rounded-r border-slate-300"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Required. Use $0.00 if none.
              </p>
            </div>
          </div>

          {/* Dates & Grace on same rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded border-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Grace period (days)
              </label>
              <input
                type="number"
                min={0}
                value={graceDays}
                onChange={(e) =>
                  setGraceDays(Math.max(0, parseInt(e.target.value || "0", 10)))
                }
                className="w-full rounded border-slate-300"
              />
              <p className="text-xs text-slate-500 mt-1">
                Extra days after the due date before rent is considered late.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Late fee type
                </label>
                <select
                  value={lateFeeMode}
                  onChange={(e) =>
                    setLateFeeMode(e.target.value as "flat" | "percent")
                  }
                  className="w-full rounded border-slate-300"
                >
                  <option value="flat">Flat $</option>
                  <option value="percent">Percent %</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Late fee value
                </label>
                <div className="flex">
                  {lateFeeMode === "flat" ? (
                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                      $
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                      %
                    </span>
                  )}
                  <input
                    inputMode="decimal"
                    value={lateFeeValue}
                    onChange={(e) => setLateFeeValue(e.target.value)}
                    className="w-full rounded-r border-slate-300"
                    placeholder={lateFeeMode === "flat" ? "0.00" : "0"}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lateFeeMode === "flat"
                    ? "Charge a fixed late fee in dollars."
                    : "Charge a percentage of monthly rent."}
                </p>
              </div>
            </div>
          </div>

          {/* Annual increases */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2">
              Annual increase (base term)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Increase type
                </label>
                <select
                  value={annualMode}
                  onChange={(e) =>
                    setAnnualMode(e.target.value as "flat" | "percent")
                  }
                  className="w-full rounded border-slate-300"
                >
                  <option value="percent">Percent %</option>
                  <option value="flat">Flat $</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Increase value
                </label>
                <div className="flex">
                  {annualMode === "flat" ? (
                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                      $
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                      %
                    </span>
                  )}
                  <input
                    inputMode="decimal"
                    value={annualValue}
                    onChange={(e) => setAnnualValue(e.target.value)}
                    className="w-full rounded-r border-slate-300"
                    placeholder={annualMode === "flat" ? "0.00" : "3"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Option years */}
          <div className="mt-6 border-t pt-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={withOptions}
                onChange={(e) => setWithOptions(e.target.checked)}
              />
              <span className="text-sm font-medium">Include option years</span>
            </label>

            {withOptions && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Number of option years
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={optionYears}
                    onChange={(e) =>
                      setOptionYears(Math.max(0, parseInt(e.target.value || "0", 10)))
                    }
                    className="w-full rounded border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Option increase type
                  </label>
                  <select
                    value={optionMode}
                    onChange={(e) =>
                      setOptionMode(e.target.value as "flat" | "percent")
                    }
                    className="w-full rounded border-slate-300"
                  >
                    <option value="percent">Percent %</option>
                    <option value="flat">Flat $</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Option increase value
                  </label>
                  <div className="flex">
                    {optionMode === "flat" ? (
                      <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                        $
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-slate-300 text-slate-500">
                        %
                      </span>
                    )}
                    <input
                      inputMode="decimal"
                      value={optionValue}
                      onChange={(e) => setOptionValue(e.target.value)}
                      className="w-full rounded-r border-slate-300"
                      placeholder={optionMode === "flat" ? "0.00" : "3"}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Notes (optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border-slate-300"
                placeholder="e.g., pets allowed, parking, utilities"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeaseStatus)}
                className="w-full rounded border-slate-300"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {/* Payment schedule preview */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-2">
              Payment schedule (preview)
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left p-2">Year</th>
                    <th className="text-left p-2">Period</th>
                    <th className="text-left p-2">Monthly rent</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.length === 0 && (
                    <tr>
                      <td className="p-3 text-slate-500" colSpan={3}>
                        Enter start/end, monthly rent & increases to preview.
                      </td>
                    </tr>
                  )}
                  {schedule.map((s) => (
                    <tr key={s.year} className="border-t border-slate-100">
                      <td className="p-2">{s.year}</td>
                      <td className="p-2">
                        {new Date(s.periodStart).toLocaleDateString()}{" "}
                        {s.periodEnd
                          ? `– ${new Date(s.periodEnd).toLocaleDateString()}`
                          : ""}
                      </td>
                      <td className="p-2">{centsToMoney(s.monthlyCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Link
            href="/tenants"
            className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200"
          >
            Back to Tenants
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className={`px-4 py-2 rounded text-white ${
              canCreate ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300"
            }`}
          >
            Create lease
          </button>
        </div>
      </div>
    </div>
  );
}
