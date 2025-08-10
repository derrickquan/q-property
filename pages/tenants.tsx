import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Property, Tenant, UnitType } from "../lib/types";
import { load, save } from "../lib/storage";

/** STORAGE KEYS */
const PROP_KEY = "qp.properties.v1";
const TENANT_KEY = "qp.tenants.v1";

/** The same permanent mock properties you show on /properties (read-only) */
const MOCK_PROPERTIES: Property[] = [
  {
    id: "mock1",
    name: "Maplewood Apartments",
    address1: "1234 Elm Street",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    unitCount: 12,
    type: "residential",
    notes: "$1,200–$1,450 · 1–2BR",
  },
  {
    id: "mock2",
    name: "Sunset Villas",
    address1: "56 Ocean View Dr",
    city: "Santa Monica",
    state: "CA",
    zip: "90401",
    unitCount: 8,
    type: "residential",
    notes: "$2,100–$2,850 · 1–2BR",
  },
  {
    id: "mock3",
    name: "Hillcrest Townhomes",
    address1: "901 Hillcrest Ave",
    city: "Pasadena",
    state: "CA",
    zip: "91105",
    unitCount: 6,
    type: "residential",
    notes: "$1,800–$2,050 · 2BR",
  },
];

const mockIds = new Set(MOCK_PROPERTIES.map((p) => p.id));

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TenantsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [items, setItems] = useState<Tenant[]>([]);
  const [query, setQuery] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);

  /** Load properties (prepend mocks) and tenants on mount */
  useEffect(() => {
    const savedProps = load<Property[]>(PROP_KEY, []);
    const filteredSavedProps = savedProps.filter((p) => !mockIds.has(p.id));
    setProperties([...MOCK_PROPERTIES, ...filteredSavedProps]);

    const savedTenants = load<Tenant[]>(TENANT_KEY, []);
    setItems(savedTenants);
  }, []);

  /** Persist tenants whenever they change */
  useEffect(() => {
    save<Tenant[]>(TENANT_KEY, items);
  }, [items]);

  /** Quick lookup: propertyId -> Property */
  const propById = useMemo(() => {
    const m = new Map<string, Property>();
    properties.forEach((p) => m.set(p.id, p));
    return m;
  }, [properties]);

  /** Filter tenants by name/email/phone/property name */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) => {
      const prop = propById.get(t.propertyId);
      return [
        t.fullName,
        t.email ?? "",
        t.phone ?? "",
        prop?.name ?? "",
        prop ? `${prop.address1} ${prop.city} ${prop.state} ${prop.zip}` : "",
        t.unit ?? "",
        t.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, propById]);

  function onCreate() {
    const firstPropertyId = properties[0]?.id ?? "";
    setEditing({
      id: "",
      fullName: "",
      email: "",
      phone: "",
      propertyId: firstPropertyId,
      unit: "",
      notes: "",
      createdAt: new Date().toISOString(),
    });
    setIsOpen(true);
  }

  function onEdit(t: Tenant) {
    setEditing({ ...t });
    setIsOpen(true);
  }

  function onDelete(id: string) {
    if (!confirm("Delete this tenant?")) return;
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;

    if (!editing.fullName.trim()) return alert("Full name is required");
    if (!editing.propertyId) return alert("Please select a property");

    // Simple email/phone sanity (non-blocking if blank)
    if (editing.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(editing.email))
      return alert("Please enter a valid email");
    if (editing.phone && !/^[0-9+()\-\s]{7,}$/.test(editing.phone))
      return alert("Please enter a valid phone number");

    setItems((prev) => {
      if (editing.id) {
        return prev.map((t) => (t.id === editing.id ? editing : t));
      } else {
        return [...prev, { ...editing, id: newId(), createdAt: new Date().toISOString() }];
      }
    });

    setIsOpen(false);
    setEditing(null);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold hover:underline">
              Q Property
            </Link>
            <span className="text-slate-400">/</span>
            <span className="font-medium">Tenants</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/properties"
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50"
            >
              Properties
            </Link>
            <button
              onClick={onCreate}
              className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Add tenant
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Search + counts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {filtered.length} of {items.length} tenants
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenants…"
            className="w-full md:w-80 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Property</Th>
                <Th>Unit</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No tenants yet. Click <span className="font-medium">Add tenant</span>.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const prop = propById.get(t.propertyId);
                  return (
                    <tr key={t.id} className="border-t border-slate-200">
                      <Td className="font-medium">
                        {t.fullName}
                        <div className="mt-0.5 text-xs text-slate-400">
                          Added {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </Td>
                      <Td>
                        {t.email ? (
                          <div className="truncate" title={t.email}>
                            {t.email}
                          </div>
                        ) : (
                          <div className="text-slate-400">—</div>
                        )}
                        {t.phone ? (
                          <div className="truncate" title={t.phone}>
                            {t.phone}
                          </div>
                        ) : (
                          <div className="text-slate-400">—</div>
                        )}
                      </Td>
                      <Td>
                        {prop ? (
                          <>
                            <div className="font-medium">{prop.name}</div>
                            <div className="text-xs text-slate-500">
                              {prop.city}, {prop.state}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400">Unknown</div>
                        )}
                      </Td>
                      <Td>{t.unit || <span className="text-slate-400">—</span>}</Td>
                      <Td className="text-right pr-4">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => onEdit(t)}
                            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
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
      </section>

      {/* Drawer / Modal editor */}
      {isOpen && editing && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setIsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold">{editing.id ? "Edit tenant" : "Add tenant"}</div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-4 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Full name</span>
                <input
                  value={editing.fullName}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-sm">Email (optional)</span>
                  <input
                    type="email"
                    value={editing.email ?? ""}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="grid grid-cols-2 gap-3">
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

                <label className="grid gap-1">
                  <span className="text-sm">Unit (optional)</span>
                  <input
                    value={editing.unit ?? ""}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., #3B"
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-sm">Notes (optional)</span>
                <textarea
                  rows={3}
                  value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editing.id ? "Save changes" : "Create tenant"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditing(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
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

/* ---------- tiny table helpers ---------- */
function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-4 py-2 text-left font-semibold ${className}`}>{children}</th>;
}

function Td(
  {
    children,
    className = "",
    ...rest
  }: React.PropsWithChildren<
    { className?: string } & React.TdHTMLAttributes<HTMLTableCellElement>
  >
) {
  return (
    <td {...rest} className={`px-4 py-2 align-top ${className}`}>
      {children}
    </td>
  );
}
