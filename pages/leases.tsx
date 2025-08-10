// pages/leases.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

/** ========= Local types (self-contained) ========= */
type UnitType = "residential" | "commercial";

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

type Tenant = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  propertyName?: string;
  unit?: string;
  notes?: string;
  balance?: number;
};

type LateFeeKind = "flat" | "percent";
type LeaseStatus = "active" | "ended";

type Lease = {
  id: string;
  tenantId: string;
  propertyId: string;
  rent: number;
  dueDay: number; // 1..28 (keep simple for months)
  frequency: "monthly";
  startDate: string; // ISO yyyy-mm-dd
  endDate?: string;  // ISO or undefined
  deposit?: number;
  graceDays?: number; // 0..10
  lateFeeKind?: LateFeeKind;
  lateFeeValue?: number; // flat $ or % based on kind
  notes?: string;
  status: LeaseStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

/** ========= Local storage helpers ========= */
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

/** ========= Storage keys (match your app) ========= */
const PROPERTIES_KEY = "properties";
const TENANTS_KEY = "tenants";
const LEASES_KEY = "leases";

/** ========= Tiny UI helpers ========= */
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
    <th className={`text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={`px-4 py-3 align-top ${className}`}>
      {children}
    </td>
  );
}

/** ========= Utilities ========= */
function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
}
function fmtMoney(n?: number) {
  const v = Number.isFinite(n as number) ? (n as number) : 0;
  return `$${v.toFixed(2)}`;
}
function fmtLateFee(kind?: LateFeeKind, val?: number) {
  if (!kind || !Number.isFinite(val as number)) return "—";
  return kind === "flat" ? fmtMoney(val) : `${val}%`;
}
function humanTerm(start: string, end?: string) {
  if (!start) return "—";
  const s = new Date(start).toLocaleDateString();
  return end ? `${s} → ${new Date(end).toLocaleDateString()}` : `${s} → open`;
}

/** ========= Main Page ========= */
export default function LeasesPage() {
  const router = useRouter();
  const selectedTenantFromQuery = typeof router.query.tenant === "string" ? router.query.tenant : undefined;

  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);

  // Load base data
  useEffect(() => {
    setProperties(load<Property[]>(PROPERTIES_KEY, []));
    setTenants(load<Tenant[]>(TENANTS_KEY, []));
    setLeases(load<Lease[]>(LEASES_KEY, []));
  }, []);

  // Persist leases
  useEffect(() => {
    save<Lease[]>(LEASES_KEY, leases);
  }, [leases]);

  const tenantById = useMemo(() => {
    const m = new Map<string, Tenant>();
    tenants.forEach((t) => m.set(t.id, t));
    return m;
  }, [tenants]);

  const propertyById = useMemo(() => {
    const m = new Map<string, Property>();
    properties.forEach((p) => m.set(p.id, p));
    return m;
  }, [properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leases
      .filter((l) => !selectedTenantFromQuery || l.tenantId === selectedTenantFromQuery)
      .filter((l) => {
        if (!q) return true;
        const t = tenantById.get(l.tenantId);
        const p = propertyById.get(l.propertyId);
        const hay = [
          t?.name ?? "",
          p?.name ?? "",
          p ? `${p.city} ${p.state}` : "",
          l.notes ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (tenantById.get(a.tenantId)?.name || "").localeCompare(tenantById.get(b.tenantId)?.name || ""));
  }, [leases, tenantById, propertyById, search, selectedTenantFromQuery]);

  function openCreate() {
    // Preselect tenant (if coming from Tenants page), and that tenant's property if available
    const tenantId = selectedTenantFromQuery ?? tenants[0]?.id ?? "";
    const t = tenantById.get(tenantId);
    const propertyId = (t?.propertyId as string) || properties[0]?.id || "";
    const now = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    setEditing({
      id: "",
      tenantId,
      propertyId,
      rent: 0,
      dueDay: 1,
      frequency: "monthly",
      startDate: now,
      endDate: undefined,
      deposit: 0,
      graceDays: 0,
      lateFeeKind: "flat",
      lateFeeValue: 0,
      notes: "",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    setShowForm(true);
  }

  function openEdit(l: Lease) {
    setEditing({ ...l });
    setShowForm(true);
  }

  function onDelete(id: string) {
    if (!confirm("Delete this lease?")) return;
    setLeases((prev) => prev.filter((l) => l.id !== id));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;

    if (!editing.tenantId) return alert("Please select a tenant.");
    if (!editing.propertyId) return alert("Please select a property.");
    if (!Number.isFinite(editing.rent) || editing.rent <= 0) return alert("Rent must be greater than 0.");
    if (!editing.dueDay || editing.dueDay < 1 || editing.dueDay > 28) return alert("Due day must be 1–28.");

    const now = new Date().toISOString();
    const next: Lease = {
      ...editing,
      id: editing.id || newId("lease"),
      updatedAt: now,
    };

    setLeases((prev) => {
      const exists = prev.some((l) => l.id === next.id);
      return exists ? prev.map((l) => (l.id === next.id ? next : l)) : [next, ...prev];
    });

    setShowForm(false);
    setEditing(null);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Section title="Leases">
        {/* Header row */}
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            {selectedTenantFromQuery ? (
              <div className="text-sm">
                Filtering by tenant:{" "}
                <b>{tenantById.get(selectedTenantFromQuery)?.name ?? selectedTenantFromQuery}</b>{" "}
                <button
                  className="ml-2 text-blue-600 hover:underline"
                  onClick={() => router.push("/leases")}
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <p className="text-slate-600">
                Create and manage lease terms that will later power Statements and reminders.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenant, property, notes…"
              className="w-72 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={openCreate}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            >
              Add lease
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <Th>Tenant</Th>
                <Th>Property</Th>
                <Th>Term</Th>
                <Th>Rent / Due</Th>
                <Th>Late fee</Th>
                <Th>Status</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <Td colSpan={7}>
                    <div className="p-6 text-center text-slate-500">
                      No leases yet. Click <b>Add lease</b> to create one.
                    </div>
                  </Td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const t = tenantById.get(l.tenantId);
                  const p = propertyById.get(l.propertyId);
                  return (
                    <tr key={l.id} className="border-b border-slate-100">
                      <Td>
                        <div className="font-medium">{t?.name ?? "—"}</div>
                        <div className="text-xs text-slate-500">
                          {t?.email ? t.email : t?.phone ? t.phone : "—"}
                        </div>
                      </Td>
                      <Td>
                        <div className="font-medium">{p?.name ?? "—"}</div>
                        <div className="text-xs text-slate-500">
                          {p ? `${p.city}, ${p.state}` : "—"}
                        </div>
                      </Td>
                      <Td>
                        <div>{humanTerm(l.startDate, l.endDate)}</div>
                        <div className="text-xs text-slate-500">{l.frequency === "monthly" ? "Monthly" : ""}</div>
                      </Td>
                      <Td>
                        <div className="font-medium">{fmtMoney(l.rent)}</div>
                        <div className="text-xs text-slate-500">
                          Due day {l.dueDay}
                          {l.graceDays ? ` · ${l.graceDays}d grace` : ""}
                        </div>
                      </Td>
                      <Td>
                        <div>{fmtLateFee(l.lateFeeKind, l.lateFeeValue)}</div>
                      </Td>
                      <Td>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                            l.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {l.status}
                        </span>
                      </Td>
                      <Td className="text-right pr-4">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEdit(l)}
                            className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(l.id)}
                            className="rounded border border-red-200 text-red-600 px-2 py-1 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Drawer/Modal */}
      {showForm && editing && (
        <LeaseFormModal
          tenants={tenants}
          properties={properties}
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
          setEditing={setEditing}
        />
      )}
    </main>
  );
}

/** ========= Lease Form Modal ========= */
function LeaseFormModal({
  tenants,
  properties,
  initial,
  onClose,
  onSubmit,
  setEditing,
}: {
  tenants: Tenant[];
  properties: Property[];
  initial: Lease;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setEditing: React.Dispatch<React.SetStateAction<Lease | null>>;
}) {
  function update<K extends keyof Lease>(key: K, value: Lease[K]) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold">{initial.id ? "Edit lease" : "Add lease"}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 py-4 grid gap-4">
          {/* Tenant & Property */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">Tenant</span>
              <select
                value={initial.tenantId}
                onChange={(e) => update("tenantId", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Property</span>
              <select
                value={initial.propertyId}
                onChange={(e) => update("propertyId", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.city}, {p.state}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Rent/Due/Deposit */}
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">Monthly rent</span>
              <input
                type="number"
                step="0.01"
                value={initial.rent}
                onChange={(e) => update("rent", parseFloat(e.target.value || "0"))}
                className="rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Due day (1–28)</span>
              <input
                type="number"
                min={1}
                max={28}
                value={initial.dueDay}
                onChange={(e) => update("dueDay", parseInt(e.target.value || "1", 10))}
                className="rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Security deposit (optional)</span>
              <input
                type="number"
                step="0.01"
                value={initial.deposit ?? 0}
                onChange={(e) => update("deposit", parseFloat(e.target.value || "0"))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">Start date</span>
              <input
                type="date"
                value={initial.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">End date (optional)</span>
              <input
                type="date"
                value={initial.endDate ?? ""}
                onChange={(e) => update("endDate", e.target.value || undefined)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {/* Grace & Late Fee */}
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">Grace days</span>
              <input
                type="number"
                min={0}
                max={10}
                value={initial.graceDays ?? 0}
                onChange={(e) => update("graceDays", parseInt(e.target.value || "0", 10))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Late fee type</span>
              <select
                value={initial.lateFeeKind ?? "flat"}
                onChange={(e) => update("lateFeeKind", e.target.value as LateFeeKind)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="flat">Flat $</option>
                <option value="percent">% of rent</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Late fee value</span>
              <input
                type="number"
                step="0.01"
                value={initial.lateFeeValue ?? 0}
                onChange={(e) => update("lateFeeValue", parseFloat(e.target.value || "0"))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {/* Notes & Status */}
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm">Notes (optional)</span>
              <input
                value={initial.notes ?? ""}
                onChange={(e) => update("notes", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="e.g., Pets allowed, parking, utilities"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Status</span>
              <select
                value={initial.status}
                onChange={(e) => update("status", e.target.value as LeaseStatus)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            >
              {initial.id ? "Save changes" : "Create lease"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
