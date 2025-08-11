// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Property, Tenant, Lease, LateFeeType, LeaseStatus } from "../lib/types";
import { load, save } from "../lib/storage";

/* -------------------------- table cell helpers -------------------------- */
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

/* ------------------------------- storage ------------------------------- */
const K_PROPERTIES = "properties";
const K_TENANTS = "tenants";
const K_LEASES = "leases";

/* -------------------------------- utils -------------------------------- */
const today = () => {
  const d = new Date();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const sanitizeMoney = (s: string) => {
  const cleaned = s.replace(/[^\d.]/g, "");
  const [l = "0", r = ""] = cleaned.split(".");
  const left = `${Number(l)}`;
  const right = r.slice(0, 2);
  return right ? `${left}.${right}` : left;
};
const parseCurrency = (s: string) => {
  const n = Number((s || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const isFiniteNum = (s: string | number) => Number.isFinite(Number(s));

/** Prefer First + Last, then fullName, then email/phone, then “(unnamed)” */
function tenantDisplay(t?: Tenant): string {
  if (!t) return "—";
  const fl = [t.firstName, t.lastName].filter(Boolean).join(" ").trim();
  if (fl) return fl;
  const full = (t as any).fullName?.trim?.() || "";
  if (full) return full;
  const email = (t.email || "").trim();
  if (email) return email;
  const phone = (t.phone || "").trim();
  if (phone) return phone;
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

/** months difference rounded up to whole lease “years” when divided by 12 */
function monthsDiffRoundedUp(startISO: string, endISO?: string): number {
  const s = new Date(startISO);
  const e = endISO ? new Date(endISO) : new Date(s);
  if (!endISO) e.setFullYear(s.getFullYear() + 1); // default 1 year
  const m1 = s.getFullYear() * 12 + s.getMonth();
  const m2 = e.getFullYear() * 12 + e.getMonth();
  const months = Math.max(1, m2 - m1 + 1); // include the end month
  return months;
}

/* -------------------------------- page --------------------------------- */
export default function LeasesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Seed fallback data so dropdowns are never empty
  useEffect(() => {
    const storedProps = load<Property[]>(K_PROPERTIES, []);
    if (storedProps.length === 0) {
      const seeded: Property[] = [
        {
          id: "mock_prop_1",
          name: "Maplewood Apartments",
          address1: "110 Maple St, #A",
          city: "Los Angeles",
          state: "CA",
          unitCount: 12,
          type: "residential" as any,
        },
        {
          id: "mock_prop_2",
          name: "Sunset Plaza Retail",
          address1: "88 Sunset Blvd",
          city: "Los Angeles",
          state: "CA",
          unitCount: 3,
          type: "commercial" as any,
        },
        {
          id: "mock_prop_3",
          name: "Cedar Fourplex",
          address1: "33 Cedar Ave",
          city: "Burbank",
          state: "CA",
          unitCount: 4,
          type: "residential" as any,
        },
      ];
      setProperties(seeded);
      save(K_PROPERTIES, seeded);
    } else {
      setProperties(storedProps);
    }

    const storedTenants = load<Tenant[]>(K_TENANTS, []);
    if (storedTenants.length === 0) {
      const seededT: Tenant[] = [
        { id: "mock_t_1", firstName: "Alex", lastName: "Nguyen", email: "alex@example.com" } as Tenant,
        { id: "mock_t_2", firstName: "Brianna", lastName: "Lopez", phone: "555-201-4455" } as Tenant,
        { id: "mock_t_3", firstName: "Chris", lastName: "Patel" } as Tenant,
      ];
      setTenants(seededT);
      save(K_TENANTS, seededT);
    } else {
      setTenants(storedTenants);
    }

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
            <Link className="hover:text-slate-900" href="/statements">Statements</Link>
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

/* ---------------------------- create lease modal ---------------------------- */

type CreateProps = {
  properties: Property[];
  tenants: Tenant[];
  onClose: () => void;
  onCreate: (lease: Lease) => void;
};

function CreateLeaseModal({ properties, tenants, onClose, onCreate }: CreateProps) {
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

  // New: annual increases + option years
  const [incType, setIncType] = useState<"flat" | "percent">("percent");
  const [incValue, setIncValue] = useState<string>("3"); // % by default
  const [hasOptions, setHasOptions] = useState<boolean>(false);
  const [optionYears, setOptionYears] = useState<number>(0);
  const [optIncType, setOptIncType] = useState<"flat" | "percent">("percent");
  const [optIncValue, setOptIncValue] = useState<string>("3");

  const sortedTenants = useMemo(
    () => [...tenants].sort((a, b) => tenantDisplay(a).localeCompare(tenantDisplay(b))),
    [tenants]
  );
  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => propertyLabel(a).localeCompare(propertyLabel(b))),
    [properties]
  );

  /* ------------------------ derived: schedule preview ------------------------ */
  const schedule = useMemo(() => {
    // base term in years (ceiling of months/12)
    const baseMonths = monthsDiffRoundedUp(startDate, endDate || undefined);
    const baseYears = Math.max(1, Math.ceil(baseMonths / 12));
    const extraYears = hasOptions ? Math.max(0, optionYears) : 0;

    const rows: { label: string; yearIndex: number; monthly: number }[] = [];
    let amt = parseCurrency(monthlyRent) || 0;

    for (let i = 1; i <= baseYears; i++) {
      rows.push({ label: `Year ${i}`, yearIndex: i, monthly: amt });
      // bump for next year (base term rule)
      const incV = Number(incValue) || 0;
      amt = incType === "percent" ? amt * (1 + incV / 100) : amt + incV;
    }

    for (let j = 1; j <= extraYears; j++) {
      rows.push({ label: `Option ${j}`, yearIndex: baseYears + j, monthly: amt });
      // bump for next option year (option rule)
      const oV = Number(optIncValue) || 0;
      amt = optIncType === "percent" ? amt * (1 + oV / 100) : amt + oV;
    }

    return rows;
  }, [monthlyRent, startDate, endDate, incType, incValue, hasOptions, optionYears, optIncType, optIncValue]);

  /* ---------------------------- submit & validation --------------------------- */
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
    // Keep Lease shape stable; stash new fields in notes for now
    const extra = ` | Increase: ${incType} ${incValue}${
      incType === "percent" ? "%" : ""
    } | Options: ${hasOptions ? `${optionYears} (${optIncType} ${optIncValue}${optIncType === "percent" ? "%" : ""})` : "none"}`;
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
      notes: [notes || "", extra].filter(Boolean).join(""),
      status,
    } as Lease;
    onCreate(lease);
  }

  /* --------------------------------- render --------------------------------- */
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40">
      <div
        className="max-w-4xl w-[960px] bg-white rounded-2xl shadow-xl border border-slate-200"
        // prevent backdrop-close by not attaching any click handler to the overlay
      >
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

          {/* Security deposit + Grace period (same row) */}
          <Labeled label="Security deposit" hint="Required. Use $0.00 if none.">
            <CurrencyInput value={securityDeposit} onChange={setSecurityDeposit} />
          </Labeled>
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

          {/* Start + End (same row) */}
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

          {/* Late fee row stays aligned */}
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
            hint={lateFeeType === "flat" ? "Charge a fixed late fee in dollars." : "Charge a % of the monthly rent."}
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

          {/* Annual increases */}
          <div className="md:col-span-2 border-t border-slate-200 pt-3" />
          <Labeled label="Annual increase type">
            <select
              value={incType}
              onChange={(e) => setIncType(e.target.value as "flat" | "percent")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="percent">% increase each year</option>
              <option value="flat">Flat $ increase each year</option>
            </select>
          </Labeled>
          <Labeled label="Annual increase value">
            {incType === "percent" ? (
              <div className="flex items-center">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={incValue}
                  onChange={(e) => setIncValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                <span className="ml-2 text-slate-500">%</span>
              </div>
            ) : (
              <CurrencyInput value={incValue} onChange={setIncValue} />
            )}
          </Labeled>

          {/* Option years toggle + controls */}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={hasOptions}
                onChange={(e) => setHasOptions(e.target.checked)}
              />
              <span className="text-sm">Include option years</span>
            </label>
          </div>

          {hasOptions && (
            <>
              <Labeled label="Number of option years">
                <input
                  type="number"
                  min={0}
                  value={optionYears}
                  onChange={(e) => setOptionYears(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </Labeled>
              <div />
              <Labeled label="Option increase type">
                <select
                  value={optIncType}
                  onChange={(e) => setOptIncType(e.target.value as "flat" | "percent")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="percent">% increase each option year</option>
                  <option value="flat">Flat $ increase each option year</option>
                </select>
              </Labeled>
              <Labeled label="Option increase value">
                {optIncType === "percent" ? (
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={optIncValue}
                      onChange={(e) => setOptIncValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                    <span className="ml-2 text-slate-500">%</span>
                  </div>
                ) : (
                  <CurrencyInput value={optIncValue} onChange={setOptIncValue} />
                )}
              </Labeled>
            </>
          )}

          {/* Notes + Status */}
          <Labeled label="Notes (optional)">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., pets allowed, parking, utilities"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </Labeled>
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

          {/* Live schedule table */}
          <div className="md:col-span-2">
            <div className="mt-4 mb-2 text-sm font-semibold">Year-by-Year Rent Schedule</div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <Th className="w-32">Period</Th>
                    <Th className="text-right w-40">Monthly rent</Th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.yearIndex} className="border-t border-slate-100">
                      <Td>{row.label}</Td>
                      <Td className="text-right">${row.monthly.toFixed(2)}</Td>
                    </tr>
                  ))}
                  {schedule.length === 0 && (
                    <tr>
                      <Td colSpan={2} className="text-center text-slate-500">
                        Enter rent and dates to preview the schedule.
                      </Td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

/* ---------------------- labeled wrapper & currency input --------------------- */
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
