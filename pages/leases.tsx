// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Property, Tenant, Lease, LateFeeType, LeaseStatus } from "../lib/types";
import { load, save } from "../lib/storage";

/** ---------- table cells (typed so colSpan/title work) ---------- */
function Th(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <th
      className={`text-left text-xs font-semibold uppercase tracking-wide text-slate-500 p-3 ${className}`}
      {...rest}
    />
  );
}
function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = "", ...rest } = props;
  return <td className={`p-3 align-middle ${className}`} {...rest} />;
}

/** ---------- keys ---------- */
const K_PROPERTIES = "properties";
const K_TENANTS = "tenants";
const K_LEASES = "leases";

/** ---------- helpers ---------- */
function tenantDisplay(t?: Tenant): string {
  if (!t) return "—";
  const fromFull = (t.fullName || "").trim();
  if (fromFull) return fromFull;
  const parts = [t.firstName, t.lastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (t.email?.trim()) return t.email.trim();
  if (t.phone?.trim()) return t.phone.trim();
  return "(unnamed)";
}
function propertyLabel(p?: Property): string {
  if (!p) return "—";
  const byName = (p.name || "").trim();
  if (byName) return byName;
  const byAddr = [p.address1, p.city, p.state].filter(Boolean).join(", ").trim();
  if (byAddr) return byAddr;
  return "(unnamed)";
}
function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function sanitizeMoney(s: string): string {
  const cleaned = s.replace(/[^\d.]/g, "");
  const [l = "0", r = ""] = cleaned.split(".");
  const left = `${Number(l)}`;
  const right = r.slice(0, 2);
  return right ? `${left}.${right}` : `${left}.00`.replace(/\.00$/, "");
}
function parseCurrency(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function isFiniteNum(s: string): boolean {
  const n = Number(s);
  return Number.isFinite(n);
}

/** ---------- page ---------- */
export default function LeasesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setProperties(load<Property[]>(K_PROPERTIES, []));
    setTenants(load<Tenant[]>(K_TENANTS, []));
    setLeases(load<Lease[]>(K_LEASES, []));
  }, []);

  const rows = useMemo(() => {
    const byTenant = new Map(tenants.map((t) => [t.id, t]));
    const byProp = new Map(properties.map((p) => [p.id, p]));
    return (leases ?? [])
      .map((l) => {
        const t = byTenant.get(l.tenantId);
        const p = byProp.get(l.propertyId);
        return {
          ...l,
          tenantName: tenantDisplay(t),
          propertyText: propertyLabel(p),
        };
      })
      .sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  }, [leases, tenants, properties]);

  function upsertLease(newLease: Lease) {
    const next = [...leases, newLease];
    setLeases(next);
    save(K_LEASES, next);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold hover:opacity-80">Q Property</Link>
          <nav className="flex gap-6 text-slate-600">
            <Link className="hover:text-slate-900" href="/properties">Properties</Link>
            <Link className="hover:text-slate-900" href="/tenants">Tenants</Link>
            <span className="text-slate-900 font-medium">Leases</span>
          </nav>
          <div />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Leases</h1>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setShowCreate(true)}
          >
            Add lease
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th className="text-right">Monthly</Th>
                <Th className="text-center">Due</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <Td>{r.tenantName}</Td>
                  <Td className="max-w-[260px] truncate" title={r.propertyText}>{r.propertyText}</Td>
                  <Td className="text-right">${r.monthlyRent.toFixed(2)}</Td>
                  <Td className="text-center">{r.dueDay}</Td>
                  <Td>{r.startDate}</Td>
                  <Td>{r.endDate ?? "—"}</Td>
                  <Td className="capitalize">{r.status}</Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <Td colSpan={7} className="text-center text-slate-500">
                    No leases yet.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showCreate && (
        <CreateLeaseModal
          properties={properties}
          tenants={tenants}
          onClose={() => setShowCreate(false)}
          onCreate={(lease) => {
            upsertLease(lease);
            setShowCreate(false);
          }}
        />
      )}
    </main>
  );
}

/** ---------- create modal ---------- */

type CreateProps = {
  properties: Property[];
  tenants: Tenant[];
  onClose: () => void;
  onCreate: (lease: Lease) => void;
};

function CreateLeaseModal({ properties, tenants, onClose, onCreate }: CreateProps) {
  // form state
  const [tenantId, setTenantId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [monthlyRent, setMonthlyRent] = useState<string>("0.00");
  const [dueDay, setDueDay] = useState<number>(1);
  const [securityDeposit, setSecurityDeposit] = useState<string>("0.00");
  const [startDate, setStartDate] = useState<string>(today());
  const [endDate, setEndDate] = useState<string>("");
  const [graceDays, setGraceDays] = useState<number>(0);
  const [lateFeeType, setLateFeeType] = useState<LateFeeType>("flat");
  const [lateFeeValue, setLateFeeValue] = useState<string>("0.00");
  const [status, setStatus] = useState<LeaseStatus>("active");
  const [notes, setNotes] = useState("");

  const sortedTenants = useMemo(
    () => [...tenants].sort((a, b) => tenantDisplay(a).localeCompare(tenantDisplay(b))),
    [tenants]
  );
  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => propertyLabel(a).localeCompare(propertyLabel(b))),
    [properties]
  );

  const canSubmit =
    tenantId &&
    propertyId &&
    isFiniteNum(monthlyRent) &&
    isFiniteNum(securityDeposit) &&
    dueDay >= 1 &&
    dueDay <= 28 &&
    graceDays >= 0 &&
    isFiniteNum(lateFeeValue);

  function submit() {
    if (!canSubmit) return;
    const lease: Lease = {
      id: `l_${Date.now()}`,
      tenantId,
      propertyId,
      monthlyRent: Number(parseCurrency(monthlyRent)),
      dueDay,
      securityDeposit: Number(parseCurrency(securityDeposit)),
      startDate,
      endDate: endDate || undefined,
      graceDays,
      lateFeeType,
      lateFeeValue: lateFeeType === "flat" ? Number(parseCurrency(lateFeeValue)) : Number(lateFeeValue),
      notes: notes || undefined,
      status,
    };
    onCreate(lease);
  }

  // no backdrop-click close
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40">
      <div className="max-w-3xl w-[880px] bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-semibold">Add lease</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">Close</button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tenant */}
          <Labeled label="Tenant">
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">— Select tenant —</option>
              {sortedTenants.map((t) => (
                <option key={t.id} value={t.id}>{tenantDisplay(t)}</option>
              ))}
            </select>
            {sortedTenants.length === 0 && (
              <div className="text-xs text-slate-500 mt-1">
                No tenants yet. <Link className="underline hover:text-slate-900" href="/tenants">Add a tenant</Link>.
              </div>
            )}
          </Labeled>

          {/* Property */}
          <Labeled label="Property">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">— Select property —</option>
              {sortedProperties.map((p) => (
                <option key={p.id} value={p.id}>{propertyLabel(p)}</option>
              ))}
            </select>
            {sortedProperties.length === 0 && (
              <div className="text-xs text-slate-500 mt-1">
                No properties yet. <Link className="underline hover:text-slate-900" href="/properties">Add a property</Link>.
              </div>
            )}
          </Labeled>

          {/* Monthly rent */}
          <Labeled label="Monthly rent" hint="Enter dollars and cents.">
            <CurrencyInput value={monthlyRent} onChange={setMonthlyRent} />
          </Labeled>

          {/* Due day */}
          <Labeled label="Due day (1–28)" hint="The calendar day rent is due each month.">
            <input
              type="number"
              min={1}
              max={28}
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </Labeled>

          {/* Security deposit (required) */}
          <Labeled label="Security deposit" hint="Required. Use $0.00 if none.">
            <CurrencyInput value={securityDeposit} onChange={setSecurityDeposit} />
          </Labeled>

          {/* Dates */}
          <Labeled label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </Labeled>
          <Labeled label="End date (optional)">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </Labeled>

          {/* Grace + Late fee */}
          <Labeled
            label="Grace period (days)"
            hint="Extra days after the due date before the rent is considered late."
          >
            <input
              type="number"
              min={0}
              value={graceDays}
              onChange={(e) => setGraceDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </Labeled>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Labeled label="Late fee type">
              <select
                value={lateFeeType}
                onChange={(e) => setLateFeeType(e.target.value as LateFeeType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="flat">Flat $</option>
                <option value="percent">% of monthly rent</option>
              </select>
            </Labeled>

            <Labeled
              label="Late fee value"
              hint={
                lateFeeType === "flat"
                  ? "Charge a fixed late fee in dollars."
                  : "Charge a % of the monthly rent."
              }
            >
              {lateFeeType === "flat" ? (
                <CurrencyInput value={lateFeeValue} onChange={setLateFeeValue} />
              ) : (
                <div className="flex items-center">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={lateFeeValue}
                    onChange={(e) => setLateFeeValue(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <span className="ml-2 text-slate-500">%</span>
                </div>
              )}
            </Labeled>
          </div>

          {/* Notes */}
          <Labeled label="Notes (optional)">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., pets allowed, parking, utilities"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </Labeled>

          {/* Status */}
          <Labeled label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeaseStatus)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="ended">Ended</option>
              <option value="pending">Pending</option>
            </select>
          </Labeled>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-between">
          <Link href="/tenants" className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">
            Back to Tenants
          </Link>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded-lg text-white ${
                canSubmit ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              Create lease
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- small UI bits ---------- */
function Labeled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {children}
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function CurrencyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(sanitizeMoney(e.target.value))}
        className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2"
        placeholder="0.00"
      />
    </div>
  );
}
