// pages/tenants.tsx
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Property, Tenant, UnitType } from "../lib/types";
import { load, save } from "../lib/storage";

/** STORAGE KEYS */
const PROPERTIES_KEY = "properties";
const TENANTS_KEY = "tenants";

/** Small ID helper */
function newId(prefix = "t"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

/** Mock tenants (always visible) */
const MOCK_TENANTS: Tenant[] = [
  {
    id: "t1",
    fullName: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 111-2222",
    propertyId: "mock1", // should match a mock property ID you use
    unit: "101",
    notes: "Always pays on time",
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    fullName: "Lisa Wong",
    email: "lisa.wong@example.com",
    phone: "(555) 333-4444",
    propertyId: "mock2",
    unit: "2B",
    notes: "Prefers email contact",
    createdAt: new Date().toISOString(),
  },
];

/** Form state type (editing / creating) */
type TenantDraft = {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  propertyId: string;
  unit?: string;
  notes?: string;
};

export default function TenantsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [items, setItems] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TenantDraft | null>(null);
  const [search, setSearch] = useState("");

  /** Load properties and tenants */
  useEffect(() => {
    const props = load<Property[]>(PROPERTIES_KEY, []);
    setProperties(props);

    const stored = load<Tenant[]>(TENANTS_KEY, []);
    const filteredStored = stored.filter((t) => !MOCK_TENANTS.find((m) => m.id === t.id));
    setItems([...MOCK_TENANTS, ...filteredStored]);
  }, []);

  /** Persist user-created tenants (don’t persist mock IDs) */
  useEffect(() => {
    const nonMock = items.filter((t) => !MOCK_TENANTS.find((m) => m.id === t.id));
    save(TENANTS_KEY, nonMock);
  }, [items]);

  const propertyIndex = useMemo(() => {
    const map = new Map<string, Property>();
    for (const p of properties) map.set(p.id, p);
    return map;
  }, [properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) => {
      const prop = propertyIndex.get(t.propertyId);
      const hay =
        `${t.fullName} ${t.email ?? ""} ${t.phone ?? ""} ${t.unit ?? ""} ${
          prop ? `${prop.name} ${prop.city} ${prop.state}` : ""
        }`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, propertyIndex]);

  function openCreate() {
    const firstPropId = properties[0]?.id ?? "";
    setEditing({
      fullName: "",
      email: "",
      phone: "",
      propertyId: firstPropId,
      unit: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(t: Tenant) {
    setEditing({
      id: t.id,
      fullName: t.fullName,
      email: t.email ?? "",
      phone: t.phone ?? "",
      propertyId: t.propertyId,
      unit: t.unit ?? "",
      notes: t.notes ?? "",
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const now = new Date().toISOString();

    if (editing.id) {
      setItems((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? {
                ...t,
                fullName: editing.fullName.trim(),
                email: editing.email?.trim() || undefined,
                phone: editing.phone?.trim() || undefined,
                propertyId: editing.propertyId,
                unit: editing.unit?.trim() || undefined,
                notes: editing.notes?.trim() || undefined,
              }
            : t
        )
      );
    } else {
      const toAdd: Tenant = {
        id: newId("t"),
        fullName: editing.fullName.trim(),
        email: editing.email?.trim() || undefined,
        phone: editing.phone?.trim() || undefined,
        propertyId: editing.propertyId,
        unit: editing.unit?.trim() || undefined,
        notes: editing.notes?.trim() || undefined,
        createdAt: now,
      };
      setItems((prev) => [toAdd, ...prev]);
    }

    closeModal();
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenants, properties, units…"
            className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add tenant
          </button>
        </div>
      </header>

      {/* Tenants Table */}
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Property / Unit</Th>
              <Th className="hidden md:table-cell">Notes</Th>
              <Th className="text-right pr-4">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filtered.map((t) => {
              const prop = propertyIndex.get(t.propertyId);
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{t.fullName}</Td>
                  <Td>
                    <div className="flex flex-col">
                      {t.email && <span>{t.email}</span>}
                      {t.phone && <span className="text-slate-500">{t.phone}</span>}
                    </div>
                  </Td>
                  <Td>
                    {prop ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{prop.name}</span>
                        <span className="text-slate-500">
                          {prop.city}, {prop.state} {t.unit ? `• Unit ${t.unit}` : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </Td>
                  <Td className="hidden md:table-cell max-w-[280px] truncate">
                    {t.notes ?? "—"}
                  </Td>
                  <Td className="text-right pr-4">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      {/* Hide delete for mock rows to keep them permanent */}
                      {!MOCK_TENANTS.find((m) => m.id === t.id) && (
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="rounded border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-10 text-center text-slate-500">
                  No tenants found. Click <b>Add tenant</b> to get started.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg font-semibold">
                {editing.id ? "Edit tenant" : "Add tenant"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleSave}>
              <label className="grid gap-1">
                <span className="text-sm">Full name</span>
                <input
                  value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-sm">Email (optional)</span>
                  <input
                    value={editing.email ?? ""}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    type="email"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-sm">Phone (optional)</span>
                  <input
                    value={editing.phone ?? ""}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </label>
              </div>

              {/* Property full width */}
              <label className="grid gap-1">
                <span className="text-sm">Property</span>
                <select
                  value={editing.propertyId}
                  onChange={(e) => setEditing({ ...editing, propertyId: e.target.value })}
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

              {/* Unit on its own line */}
              <label className="grid gap-1">
                <span className="text-sm">Unit (optional)</span>
                <input
                  value={editing.unit ?? ""}
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., #3B"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Notes (optional)</span>
                <textarea
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="min-h-[110px] rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {editing.id ? "Save changes" : "Create tenant"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* Table helpers */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${className}`}>
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
    <td className={`px-3 py-3 align-top ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
