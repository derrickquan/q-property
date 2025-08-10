import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { load, save } from "../lib/storage";
import type { Property, Tenant } from "../lib/types";

/** ---------- Types ---------- */
type LateFeeType = "flat" | "percent";

type LeaseStatus = "active" | "ended";

type Lease = {
  id: string;
  tenantId: string;
  propertyId: string;

  rentMonthly: number; // dollars.cents (e.g., 1234.56)
  securityDeposit: number; // dollars.cents
  dueDay: number; // 1-28
  startDate: string; // ISO date
  endDate?: string; // ISO date (optional)

  graceDays: number; // days after due day before late
  lateFeeType: LateFeeType;
  lateFeeValue: number; // dollars or percent depending on type

  notes?: string;
  status: LeaseStatus;
};

/** ---------- Storage keys ---------- */
const K_PROPERTIES = "properties";
const K_TENANTS = "tenants";
const K_LEASES = "leases";

/** ---------- Small UI helpers ---------- */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{children}</label>;
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

/** Currency input with $ prefix, stores as number (e.g. 1234.56) */
function CurrencyInput({
  value,
  onChange,
  placeholder = "$ 0",
  required = false,
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
      <input
        id={id}
        required={required}
        type="text"
        inputMode="decimal"
        className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          const n = raw === "" ? 0 : Number(raw);
          if (!Number.isNaN(n)) onChange(Number(n.toFixed(2)));
        }}
      />
    </div>
  );
}

/** Percentage input with % suffix */
function PercentInput({
  value,
  onChange,
  placeholder = "0",
  id,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step={0.1}
        className="w-full rounded-md border border-slate-300 pr-7 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Number(n.toFixed(2)));
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
    </div>
  );
}

/** ---------- Page ---------- */
export default function LeasesPage() {
  /** Seed when empty so dropdowns have something the first time */
  useEffect(() => {
    const ps = load<Property[]>(K_PROPERTIES, []);
    if (ps.length === 0) {
      const seeded: Property[] = [
        {
          id: "mock1",
          name: "Maplewood Apartments",
          address1: "1234 Elm Street",
          city: "Los Angeles",
          state: "CA",
          zip: "90001",
          unitCount: 12,
          type: "residential",
        } as any,
        {
          id: "mock2",
          name: "Suncrest Plaza Retail",
          address1: "88 Market Street",
          city: "San Diego",
          state: "CA",
          zip: "92101",
          unitCount: 6,
          type: "commercial",
        } as any,
      ];
      save(K_PROPERTIES, seeded);
    }

    const ts = load<Tenant[]>(K_TENANTS, []);
    if (ts.length === 0) {
      const seededT: Tenant[] = [
        {
          id: "t1",
          name: "Ava Johnson",
          email: "ava@example.com",
          phone: "(555) 111-2222",
          propertyId: "mock1",
          unit: "3B",
          notes: "Good payer",
        } as any,
        {
          id: "t2",
          name: "Michael Chen",
          email: "mchen@example.com",
          phone: "(555) 333-4444",
          propertyId: "mock2",
          unit: "A1",
        } as any,
      ];
      save(K_TENANTS, seededT);
    }
  }, []);

  /** Data */
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);

  useEffect(() => {
    setProperties(load<Property[]>(K_PROPERTIES, []));
    setTenants(load<Tenant[]>(K_TENANTS, []));
    setLeases(load<Lease[]>(K_LEASES, []));
  }, []);

  /** Add Lease sheet/modal */
  const [showAdd, setShowAdd] = useState(false);

  // form state
  const [tenantId, setTenantId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");

  const [rentMonthly, setRentMonthly] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [dueDay, setDueDay] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>("");

  const [graceDays, setGraceDays] = useState<number>(0);
  const [lateType, setLateType] = useState<LateFeeType>("flat");
  const [lateValue, setLateValue] = useState<number>(0);

  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<LeaseStatus>("active");

  /** Derived: options */
  const propertyOptions = useMemo(() => properties, [properties]);
  const tenantOptions = useMemo(() => tenants, [tenants]);

  /** Create lease */
  function resetForm() {
    setTenantId("");
    setPropertyId("");
    setRentMonthly(0);
    setDeposit(0);
    setDueDay(1);
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setGraceDays(0);
    setLateType("flat");
    setLateValue(0);
    setNotes("");
    setStatus("active");
  }

  function handleCreateLease(e?: React.FormEvent) {
    e?.preventDefault();
    if (!tenantId || !propertyId) return;

    const newLease: Lease = {
      id: `lease_${Date.now()}`,
      tenantId,
      propertyId,
      rentMonthly,
      securityDeposit: deposit,
      dueDay,
      startDate,
      endDate: endDate || undefined,
      graceDays,
      lateFeeType: lateType,
      lateFeeValue: lateValue,
      notes: notes || undefined,
      status,
    };

    const next = [newLease, ...leases];
    setLeases(next);
    save(K_LEASES, next);

    // close manually
    setShowAdd(false);
    resetForm();
  }

  /** UI */
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold">Q Property</Link>
          <nav className="flex items-center gap-6 text-slate-600">
            <Link className="hover:text-slate-900" href="/properties">Properties</Link>
            <Link className="hover:text-slate-900" href="/tenants">Tenants</Link>
            <span className="text-slate-900 font-medium">Leases</span>
          </nav>
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Leases</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
          >
            Add lease
          </button>
        </div>

        {/* Existing leases table (simple) */}
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Property</th>
                <th className="text-right p-3">Rent</th>
                <th className="text-center p-3">Due</th>
                <th className="text-left p-3">Dates</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leases.length === 0 && (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={6}>
                    No leases yet.
                  </td>
                </tr>
              )}
              {leases.map((l) => {
                const t = tenants.find((x) => x.id === l.tenantId);
                const p = properties.find((x) => x.id === l.propertyId);
                return (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="p-3">{t ? t.name : "—"}</td>
                    <td className="p-3">
                      {p ? `${p.name}${p.city ? ` — ${p.city}, ${p.state}` : ""}` : "—"}
                    </td>
                    <td className="p-3 text-right">${l.rentMonthly.toFixed(2)}</td>
                    <td className="p-3 text-center">{l.dueDay}</td>
                    <td className="p-3">
                      {l.startDate}
                      {l.endDate ? ` → ${l.endDate}` : ""}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={
                          l.status === "active"
                            ? "inline-flex rounded-full bg-green-50 text-green-700 px-2 py-0.5"
                            : "inline-flex rounded-full bg-slate-100 text-slate-700 px-2 py-0.5"
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Lease overlay — manual close only */}
      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 p-4">
          {/* Clicks on the backdrop do nothing; only buttons close */}
          <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h2 className="text-lg font-semibold">Add lease</h2>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setShowAdd(false)}
              >
                Close
              </button>
            </div>

            <form
              className="p-4 grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateLease();
              }}
            >
              {/* Top selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field>
                  <Label>Tenant</Label>
                  <select
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                  >
                    <option value="">— Select tenant —</option>
                    {tenantOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.unit ? ` — ${t.unit}` : ""}
                        {t.propertyId
                          ? (() => {
                              const p = properties.find((x) => x.id === t.propertyId);
                              return p ? ` @ ${p.name}` : "";
                            })()
                          : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  <Label>Property</Label>
                  <select
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                  >
                    <option value="">— Select property —</option>
                    {propertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.city ? ` — ${p.city}, ${p.state}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Money / due row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field>
                  <Label>Monthly rent</Label>
                  <CurrencyInput value={rentMonthly} onChange={setRentMonthly} placeholder="$ 0.00" />
                  <Help>Enter dollars and cents.</Help>
                </Field>

                <Field>
                  <Label>Due day (1–28)</Label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={dueDay}
                    onChange={(e) => setDueDay(Math.min(28, Math.max(1, Number(e.target.value) || 1)))}
                  />
                  <Help>The calendar day rent is due each month.</Help>
                </Field>

                <Field>
                  <Label>Security deposit</Label>
                  <CurrencyInput
                    value={deposit}
                    onChange={setDeposit}
                    placeholder="$ 0.00"
                    required
                  />
                  <Help>Required. Use $0.00 if none.</Help>
                </Field>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field>
                  <Label>Start date</Label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>End date (optional)</Label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Field>
              </div>

              {/* Grace + Late fee (same row) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field>
                  <Label>Grace period (days)</Label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={graceDays}
                    onChange={(e) => setGraceDays(Math.max(0, Number(e.target.value) || 0))}
                  />
                  <Help>Extra days after the due date before the rent is considered late.</Help>
                </Field>

                <Field>
                  <Label>Late fee type</Label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={lateType}
                    onChange={(e) => {
                      const next = e.target.value as LateFeeType;
                      setLateType(next);
                      // keep value safe if switching to percent
                      if (next === "percent") setLateValue(Math.min(100, Math.max(0, lateValue)));
                    }}
                  >
                    <option value="flat">Flat $</option>
                    <option value="percent">Percent %</option>
                  </select>
                </Field>

                <Field>
                  <Label>Late fee value</Label>
                  {lateType === "flat" ? (
                    <>
                      <CurrencyInput value={lateValue} onChange={setLateValue} placeholder="$ 0.00" />
                      <Help>Charge a fixed late fee in dollars.</Help>
                    </>
                  ) : (
                    <>
                      <PercentInput value={lateValue} onChange={setLateValue} />
                      <Help>Charge a percentage of monthly rent (0–100%).</Help>
                    </>
                  )}
                </Field>
              </div>

              {/* Notes + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field>
                  <Label>Notes (optional)</Label>
                  <input
                    type="text"
                    placeholder="e.g., pets allowed, parking, utilities"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>
                <Field>
                  <Label>Status</Label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeaseStatus)}
                  >
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </Field>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <Link
                  href="/tenants"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Back to Tenants
                </Link>

                <div className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdd(false); // manual close
                    }}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
                  >
                    Create lease
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
