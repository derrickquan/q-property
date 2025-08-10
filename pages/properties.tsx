import React, { useEffect, useMemo, useState } from "react";
import type { Property, UnitType } from "../lib/types";
import { load, save } from "../lib/storage";
import Link from "next/link";

const STORAGE_KEY = "qp.properties.v1";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Property | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load once on mount
  useEffect(() => {
    setItems(load<Property[]>(STORAGE_KEY, []));
  }, []);

  // Save whenever items change
  useEffect(() => {
    save<Property[]>(STORAGE_KEY, items);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.name, p.address1, p.city, p.state, p.zip].some((v) =>
        (v || "").toLowerCase().includes(q)
      )
    );
  }, [items, query]);

  function onCreate() {
    setEditing({
      id: "",
      name: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      unitCount: 1,
      type: "residential",
      notes: "",
    });
    setIsOpen(true);
  }

  function onEdit(p: Property) {
    setEditing({ ...p });
    setIsOpen(true);
  }

  function onDelete(id: string) {
    if (!confirm("Delete this property?")) return;
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim()) return alert("Name is required");
    if (!editing.address1.trim()) return alert("Address is required");
    if (!editing.city.trim()) return alert("City is required");
    if (!editing.state.trim()) return alert("State is required");
    if (!editing.zip.trim()) return alert("ZIP is required");
    if (editing.unitCount < 0) return alert("Units must be 0 or more");

    setItems((prev) => {
      if (editing.id) {
        // update
        return prev.map((p) => (p.id === editing.id ? editing : p));
      } else {
        // create
        return [...prev, { ...editing, id: newId() }];
      }
    });
    setIsOpen(false);
    setEditing(null);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top bar (keep consistent with your site header style) */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold hover:underline">Q Property</Link>
            <span className="text-slate-400">/</span>
            <span className="font-medium">Properties</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">Home</Link>
            <button onClick={onCreate} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">
              Add property
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Search + counts */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {filtered.length} of {items.length} properties
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties…"
            className="w-full md:w-72 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Name</Th>
                <Th>Address</Th>
                <Th>City</Th>
                <Th>State</Th>
                <Th>ZIP</Th>
                <Th className="text-right">Units</Th>
                <Th>Type</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No properties yet. Click <span className="font-medium">Add property</span>.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <Td className="font-medium">{p.name}</Td>
                    <Td>{p.address1}{p.address2 ? `, ${p.address2}` : ""}</Td>
                    <Td>{p.city}</Td>
                    <Td>{p.state}</Td>
                    <Td>{p.zip}</Td>
                    <Td className="text-right">{p.unitCount}</Td>
                    <Td className="capitalize">{p.type}</Td>
                    <Td className="text-right pr-4">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => onEdit(p)}
                          className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(p.id)}
                          className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Drawer / Modal-ish editor */}
      {isOpen && editing && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setIsOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold">{editing.id ? "Edit property" : "Add property"}</div>
              <button onClick={() => setIsOpen(false)} className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">
                Close
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-4 grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm">Name</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Address line 1</span>
                <input
                  value={editing.address1}
                  onChange={(e) => setEditing({ ...editing, address1: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Address line 2 (optional)</span>
                <input
                  value={editing.address2 || ""}
                  onChange={(e) => setEditing({ ...editing, address2: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-sm">City</span>
                  <input
                    value={editing.city}
                    onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm">State</span>
                  <input
                    value={editing.state}
                    onChange={(e) => setEditing({ ...editing, state: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-sm">ZIP</span>
                  <input
                    value={editing.zip}
                    onChange={(e) => setEditing({ ...editing, zip: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm">Units</span>
                  <input
                    type="number"
                    min={0}
                    value={editing.unitCount}
                    onChange={(e) => setEditing({ ...editing, unitCount: Number(e.target.value || 0) })}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-sm">Type</span>
                <select
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value as UnitType })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-sm">Notes</span>
                <textarea
                  rows={3}
                  value={editing.notes || ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="pt-2 flex items-center gap-3">
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  {editing.id ? "Save changes" : "Create property"}
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

function Th({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={`px-4 py-2 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-2 align-top ${className}`}>{children}</td>;
}
