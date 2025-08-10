// pages/tenants.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/** =========================
 *  Local types (self-contained)
 *  ========================= */
type UnitType = "residential" | "commercial";

type Tenant = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  propertyName?: string;
  unit?: string;
  notes?: string;
  balance?: number; // current balance owed (can be negative if credit)
};

type Property = {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  unitCount?: number;
  type?: UnitType;
  notes?: string;
};

/** =========================
 *  Storage helpers (safe on SSR)
 *  ========================= */
function load<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** =========================
 *  Storage keys
 *  ========================= */
const PROPERTIES_KEY = "properties";
const TENANTS_KEY = "tenants";

/** =========================
 *  Mock data
 *  ========================= */
const MOCK_TENANTS: Tenant[] = [
  {
    id: "t_mock_elliot",
    name: "Elliot Park",
    email: "elliot@example.com",
    phone: "(424) 555-0110",
    propertyId: "mock1",
    propertyName: "Maplewood Apartments — Los Angeles, CA",
    unit: "3B",
    balance: 142.5,
    notes: "Prefers SMS reminders.",
  },
  {
    id: "t_mock_rhea",
    name: "Rhea Patel",
    email: "rhea@example.com",
    phone: "(424) 555-0127",
    propertyId: "mock2",
    propertyName: "Sunset Plaza Retail — West Hollywood, CA",
    unit: "Suite 210",
    balance: 0,
    notes: "Commercial tenant — ACH only.",
  },
];

/** =========================
 *  UI helpers
 *  ========================= */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <div className="rounded-xl border border-slate-200 bg-white">{children}</div>
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 ${className}`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 align-top ${className}`}>
      {children}
    </td>
  );
}

/** =========================
 *  Main Page
 *  ========================= */
export default function TenantsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);

  const [showPay, setShowPay] = useState(false);
  const [payTarget, setPayTarget] = useState<Tenant | null>(null);

  // Load properties/tenants and inject mocks if needed
  useEffect(() => {
    const props = load<Property[]>(PROPERTIES_KEY, []);
    setProperties(props);

    const stored = load<Tenant[]>(TENANTS_KEY, []);
    // ensure mock tenants exist
    const have = new Map(stored.map((t) => [t.id, true]));
    const withMocks = [...stored];
    MOCK_TENANTS.forEach((m) => {
      if (!have.has(m.id)) withMocks.push(m);
    });
    setTenants(withMocks);
    save(TENANTS_KEY, withMocks);
  }, []);

  const sorted = useMemo(() => {
    return [...tenants].sort((a, b) => a.name.localeCompare(b.name));
  }, [tenants]);

  function openCreate() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(t: Tenant) {
    setEditing(t);
    setShowForm(true);
  }
  function onSaveTenant(next: Tenant) {
    setTenants((prev) => {
      const idx = prev.findIndex((t) => t.id === next.id);
      const updated = idx >= 0 ? [...prev.slice(0, idx), next, ...prev.slice(idx + 1)] : [...prev, next];
      save(TENANTS_KEY, updated);
      return updated;
    });
    setShowForm(false);
    setEditing(null);
  }
  function handleDelete(id: string) {
    const isMock = MOCK_TENANTS.some((m) => m.id === id);
    if (isMock) return; // keep mock rows permanent
    if (!confirm("Delete this tenant? This cannot be undone.")) return;
    setTenants((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      save(TENANTS_KEY, updated);
      return updated;
    });
  }

  /** Payment modal handlers */
  function openPay(t: Tenant) {
    setPayTarget(t);
    setShowPay(true);
  }
  function onRecordPayment(tenantId: string, amount: number) {
    setTenants((prev) => {
      const updated = prev.map((t) =>
        t.id === tenantId ? { ...t, balance: Math.round(((t.balance ?? 0) - amount) * 100) / 100 } : t
      );
      save(TENANTS_KEY, updated);
      return updated;
    });
    setShowPay(false);
    setPayTarget(null);
  }

  return (
    <>
      <Section title="Tenants">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <p className="text-slate-600">
            Manage residents & commercial tenants. Use <b>Lease</b> or <b>Statement</b> to jump to tenant-specific pages.
          </p>
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            Add tenant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Tenant</Th>
                <Th>Contact</Th>
                <Th>Property / Unit</Th>
                <Th className="text-right">Balance</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <Td colSpan={5}>
                    <div className="text-slate-500">No tenants yet.</div>
                  </Td>
                </tr>
              )}
              {sorted.map((t) => {
                const isMock = MOCK_TENANTS.some((m) => m.id === t.id);
                return (
                  <tr key={t.id} className="border-b border-slate-100">
                    <Td>
                      <div className="font-medium text-slate-900">{t.name}</div>
                      {t.notes && <div className="text-slate-500 text-xs mt-0.5">{t.notes}</div>}
                    </Td>
                    <Td>
                      <div className="text-slate-700">{t.email || "—"}</div>
                      <div className="text-slate-500">{t.phone || "—"}</div>
                    </Td>
                    <Td>
                      <div className="text-slate-700">{t.propertyName || "—"}</div>
                      <div className="text-slate-500">{t.unit || "—"}</div>
                    </Td>
                    <Td className="text-right font-medium">
                      ${Math.abs(t.balance ?? 0).toFixed(2)}
                      {(t.balance ?? 0) >= 0 ? "" : " CR"}
                    </Td>
                    <Td className="text-right pr-4">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/leases?tenant=${encodeURIComponent(t.id)}`}
                          className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                        >
                          Lease
                        </Link>
                        <Link
                          href={`/statements?tenant=${encodeURIComponent(t.id)}`}
                          className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                        >
                          Statement
                        </Link>
                        <button
                          onClick={() => openPay(t)}
                          className="rounded border border-emerald-300 text-emerald-700 px-2 py-1 hover:bg-emerald-50"
                        >
                          Payment
                        </button>
                        <button
                          onClick={() => openEdit(t)}
                          className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        {!isMock && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="rounded border border-red-200 text-red-600 px-2 py-1 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {showForm && (
        <TenantFormModal
          properties={properties}
          initial={editing || undefined}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={onSaveTenant}
        />
      )}

      {showPay && payTarget && (
        <PaymentModal
          tenant={payTarget}
          onClose={() => {
            setShowPay(false);
            setPayTarget(null);
          }}
          onRecord={onRecordPayment}
        />
      )}
    </>
  );
}

/** =========================
 *  Tenant Form Modal
 *  ========================= */
function TenantFormModal({
  properties,
  initial,
  onClose,
  onSave,
}: {
  properties: Property[];
  initial?: Tenant;
  onClose: () => void;
  onSave: (t: Tenant) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? properties[0]?.id ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [balance, setBalance] = useState<number>(initial?.balance ?? 0);

  const propName = useMemo(() => {
    const p = properties.find((x) => x.id === propertyId);
    return p ? `${p.name} — ${p.city}, ${p.state}` : "";
  }, [propertyId, properties]);

  function submit() {
    if (!name.trim()) {
      alert("Please enter a full name.");
      return;
    }
    const t: Tenant = {
      id: initial?.id ?? `t_${Date.now()}`,
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      propertyId: propertyId || undefined,
      propertyName: propName || undefined,
      unit: unit.trim() || undefined,
      notes: notes.trim() || undefined,
      balance: Number.isFinite(balance) ? balance : 0,
    };
    onSave(t);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">{initial ? "Edit tenant" : "Add tenant"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="e.g., Jamie Nguyen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Property Select (full width) */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Property</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
            >
              {properties.length === 0 && <option value="">— No properties —</option>}
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.city}, {p.state}
                </option>
              ))}
            </select>
          </div>

          {/* Unit on its own line */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Unit (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="e.g., #3B or Suite 210"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Starting balance</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="internal note"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
          >
            {initial ? "Save changes" : "Create tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** =========================
 *  Payment Modal
 *  ========================= */
function PaymentModal({
  tenant,
  onClose,
  onRecord,
}: {
  tenant: Tenant;
  onClose: () => void;
  onRecord: (tenantId: string, amount: number) => void;
}) {
  const [amount, setAmount] = useState<number>(0);

  function submit() {
    if (!(amount > 0)) {
      alert("Enter a positive payment amount.");
      return;
    }
    onRecord(tenant.id, Math.round(amount * 100) / 100);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">Record payment</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="text-slate-700">
            Tenant: <span className="font-medium">{tenant.name}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Amount</label>
            <input
              type="number"
              step="0.01"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
            />
            <div className="text-xs text-slate-500 mt-1">
              Current balance: ${Math.abs(tenant.balance ?? 0).toFixed(2)}
              {(tenant.balance ?? 0) >= 0 ? "" : " CR"}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
          >
            Record payment
          </button>
        </div>
      </div>
    </div>
  );
}
