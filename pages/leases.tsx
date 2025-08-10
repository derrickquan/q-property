// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Property, Tenant, Lease } from "../lib/types";
import { load, save } from "../lib/storage";

/** ---------- helpers ---------- */

const tenantLabel = (t: any) => {
  if (!t) return "Unknown";
  if (t.name) return t.name;
  if (t.fullName) return t.fullName;
  const fn = t.firstName ?? "";
  const ln = t.lastName ?? "";
  const joined = `${fn} ${ln}`.trim();
  return joined || "Unknown";
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    isFinite(n) ? n : 0
  );

/** Small UI atoms (simple TD/TH to keep table markup tidy) */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-3 ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`p-3 ${className}`}>{children}</td>;
}

/** ---------- page ---------- */

export default function LeasesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);

  const [showModal, setShowModal] = useState(false);

  /** modal form state */
  const [tenantId, setTenantId] = useState<string>("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [rent, setRent] = useState<string>("0");
  const [dueDay, setDueDay] = useState<number>(1);
  const [deposit, setDeposit] = useState<string>("0");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [graceDays, setGraceDays] = useState<number>(0);
  const [lateFeeType, setLateFeeType] = useState<"flat" | "percent">("flat");
  const [lateFeeValue, setLateFeeValue] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<"active" | "ended" | "pending">("active");

  /** load storage client-side */
  useEffect(() => {
    const p = load<Property[]>("properties", []);
    const t = load<Tenant[]>("tenants", []);
    const l = load<Lease[]>("leases", []);
    setProperties(p ?? []);
    setTenants(t ?? []);
    setLeases(l ?? []);
  }, []);

  /** lookup maps */
  const byIdProperty = useMemo(() => {
    const map = new Map<string, Property>();
    properties.forEach((p) => map.set(p.id, p));
    return map;
  }, [properties]);

  const byIdTenant = useMemo(() => {
    const map = new Map<string, Tenant>();
    tenants.forEach((t) => map.set(t.id, t));
    return map;
  }, [tenants]);

  /** combine for table */
  const rows = useMemo(() => {
    return (leases ?? []).map((l) => {
      const t = byIdTenant.get(l.tenantId as any);
      const p = byIdProperty.get(l.propertyId as any);
      return { lease: l, tenant: t, property: p };
    });
  }, [leases, byIdTenant, byIdProperty]);

  /** open modal */
  const openModal = () => {
    setTenantId("");
    setPropertyId("");
    setRent("0");
    setDueDay(1);
    setDeposit("0");
    setStartDate("");
    setEndDate("");
    setGraceDays(0);
    setLateFeeType("flat");
    setLateFeeValue("0");
    setNotes("");
    setStatus("active");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  /** create */
  const createLease = () => {
    // basic guards
    if (!tenantId) {
      alert("Please select a tenant.");
      return;
    }
    if (!propertyId) {
      alert("Please select a property.");
      return;
    }
    const rentNum = Number(parseFloat(rent || "0").toFixed(2));
    const depNum = Number(parseFloat(deposit || "0").toFixed(2));
    const feeNum = Number(parseFloat(lateFeeValue || "0").toFixed(2));
    const clampedDue = Math.min(Math.max(dueDay, 1), 28);
    const clampedGrace = Math.max(0, graceDays);

    const newLease: Lease = {
      id: `lease_${Date.now()}`,
      tenantId,
      propertyId,
      monthlyRent: rentNum,
      dueDay: clampedDue,
      securityDeposit: depNum,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || undefined,
      graceDays: clampedGrace,
      lateFeeType,
      lateFeeValue: feeNum,
      notes: notes || undefined,
      status,
    } as any;

    const next = [newLease, ...(leases ?? [])];
    setLeases(next);
    save("leases", next);
    setShowModal(false);
  };

  /** derived UI bits */
  const tenantOptions = useMemo(() => {
    if (!tenants || tenants.length === 0) {
      return [
        <option key="none" value="">
          — No tenants —
        </option>,
      ];
    }
    return tenants.map((t) => (
      <option key={t.id} value={t.id}>
        {tenantLabel(t)}
        {t.unit ? ` — ${t.unit}` : ""}
        {t.propertyId
          ? (() => {
              const p = properties.find((x) => x.id === (t as any).propertyId);
              return p ? ` @ ${p.name}` : "";
            })()
          : ""}
      </option>
    ));
  }, [tenants, properties]);

  const propertyOptions = useMemo(() => {
    if (!properties || properties.length === 0) {
      return [
        <option key="none" value="">
          — No properties —
        </option>,
      ];
    }
    return properties.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name}
        {p.city ? ` — ${p.city}, ${p.state ?? ""}` : ""}
      </option>
    ));
  }, [properties]);

  const lateValuePrefix = lateFeeType === "flat" ? "$" : "%";
  const lateValuePlaceholder =
    lateFeeType === "flat" ? "0.00" : "0 (for none) … 100";
  const lateValueAria = lateFeeType === "flat" ? "dollars" : "percent";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* top nav */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 rounded bg-blue-600" />
            <span className="font-semibold">Q Property</span>
          </Link>
          <nav className="flex items-center gap-6 text-slate-600">
            <Link href="/properties" className="hover:text-slate-900">
              Properties
            </Link>
            <Link href="/tenants" className="hover:text-slate-900">
              Tenants
            </Link>
            <Link href="/leases" className="text-slate-900 font-medium">
              Leases
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2 rounded border border-slate-300 text-slate-900 hover:bg-slate-50"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Leases</h1>
          <button
            onClick={openModal}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Add lease
          </button>
        </div>

        <div className="mt-6 overflow-x-auto border border-slate-200 rounded-xl">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th className="text-right">Rent</Th>
                <Th className="text-center">Due</Th>
                <Th className="text-center">Grace</Th>
                <Th className="text-center">Late fee</Th>
                <Th>Status</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <Td className="text-slate-500" colSpan={8 as any}>
                    No leases yet.
                  </Td>
                </tr>
              )}
              {rows.map(({ lease: l, tenant: t, property: p }) => {
                const fee =
                  l.lateFeeType === "percent"
                    ? `${Number(l.lateFeeValue ?? 0)}%`
                    : fmtMoney(Number(l.lateFeeValue ?? 0));
                return (
                  <tr key={l.id} className="border-t border-slate-100">
                    <Td>{t ? tenantLabel(t) : "—"}</Td>
                    <Td>
                      {p
                        ? `${p.name}${p.city ? ` — ${p.city}, ${p.state ?? ""}` : ""}`
                        : "—"}
                    </Td>
                    <Td className="text-right">{fmtMoney(l.monthlyRent)}</Td>
                    <Td className="text-center">{l.dueDay}</Td>
                    <Td className="text-center">{l.graceDays ?? 0}</Td>
                    <Td className="text-center">
                      {l.lateFeeType === "flat" ? "Flat " : "Percent "}
                      {fee}
                    </Td>
                    <Td className="capitalize">{l.status ?? "active"}</Td>
                    <Td className="text-right pr-4">
                      <div className="flex justify-end gap-2">
                        {/* stubs for future edit/end */}
                        <button
                          className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50 text-sm"
                          onClick={() => alert("Edit coming soon")}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 rounded border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm"
                          onClick={() => {
                            if (!confirm("Delete this lease?")) return;
                            const next = leases.filter((x) => x.id !== l.id);
                            setLeases(next);
                            save("leases", next);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40">
          {/* container (no outside click close!) */}
          <div
            className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold">Add lease</h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tenant */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tenant
                  </label>
                  <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  >
                    <option value="">— Select a tenant —</option>
                    {tenantOptions}
                  </select>
                </div>

                {/* Property */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Property
                  </label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  >
                    <option value="">— No properties —</option>
                    {propertyOptions}
                  </select>
                </div>

                {/* Monthly rent */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly rent
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      inputMode="decimal"
                      value={rent}
                      onChange={(e) => setRent(e.target.value)}
                      className="w-full rounded border border-slate-300 pl-7 pr-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter dollars and cents.
                  </p>
                </div>

                {/* Due day */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Due day (1–28)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={dueDay}
                    onChange={(e) =>
                      setDueDay(Math.min(28, Math.max(1, Number(e.target.value || 1))))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    The calendar day rent is due each month.
                  </p>
                </div>

                {/* Deposit */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Security deposit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      inputMode="decimal"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      className="w-full rounded border border-slate-300 pl-7 pr-3 py-2"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Required. Use $0.00 if none.
                  </p>
                </div>

                {/* Start / End dates */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2"
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
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                </div>

                {/* Grace / Late fee (same row visually) */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Grace period (days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={graceDays}
                    onChange={(e) =>
                      setGraceDays(Math.max(0, Number(e.target.value || 0)))
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Extra days after the due date before the rent is considered
                    late.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Late fee type
                    </label>
                    <select
                      value={lateFeeType}
                      onChange={(e) =>
                        setLateFeeType(e.target.value as "flat" | "percent")
                      }
                      className="w-full rounded border border-slate-300 px-3 py-2"
                    >
                      <option value="flat">Flat $</option>
                      <option value="percent">Percent %</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Late fee value
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        {lateValuePrefix}
                      </span>
                      <input
                        inputMode="decimal"
                        aria-label={lateValueAria}
                        value={lateFeeValue}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (lateFeeType === "percent") {
                            // keep 0 - 100
                            const n = Math.max(
                              0,
                              Math.min(100, Number(v || 0))
                            );
                            setLateFeeValue(String(n));
                          } else {
                            setLateFeeValue(v);
                          }
                        }}
                        className="w-full rounded border border-slate-300 pl-7 pr-3 py-2"
                        placeholder={lateValuePlaceholder}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {lateFeeType === "flat"
                        ? "Charge a fixed late fee in dollars."
                        : "Charge a percentage of monthly rent (0–100%)."}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Notes (optional)
                  </label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="e.g., pets allowed, parking, utilities"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "active" | "ended" | "pending")
                    }
                    className="w-full rounded border border-slate-300 px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-200">
              <Link
                href="/tenants"
                className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50"
              >
                Back to Tenants
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createLease}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Create lease
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
