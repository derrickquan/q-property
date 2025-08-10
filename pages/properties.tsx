import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Property } from "../lib/types";
import { load, save } from "../lib/storage";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [query, setQuery] = useState("");

  // Mock properties that are always present
  const mockProperties: Property[] = [
    {
      id: "mock1",
      name: "Maplewood Apartments",
      address: "1234 Elm Street, Los Angeles, CA",
      units: 12,
      rentRange: "$1,200 – $1,450",
    },
    {
      id: "mock2",
      name: "Sunset Villas",
      address: "56 Ocean View Dr, Santa Monica, CA",
      units: 8,
      rentRange: "$2,100 – $2,850",
    },
    {
      id: "mock3",
      name: "Hillcrest Townhomes",
      address: "901 Hillcrest Ave, Pasadena, CA",
      units: 6,
      rentRange: "$1,800 – $2,050",
    },
  ];

  useEffect(() => {
    const saved = load<Property[]>("properties") || [];
    // Combine mock properties with saved ones (mock first, then saved)
    const combined = [...mockProperties, ...saved];
    setProperties(combined);
  }, []);

  useEffect(() => {
    // Save only the non-mock properties so mock ones don't duplicate
    const nonMock = properties.filter((p) => !p.id.startsWith("mock"));
    save("properties", nonMock);
  }, [properties]);

  const filtered = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg">Properties</h1>
        <Link
          href="/add-property"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Add Property
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search properties…"
          className="w-full md:w-72 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Name</Th>
                <Th>Address</Th>
                <Th>Units</Th>
                <Th>Rent Range</Th>
                <Th className="text-right pr-4">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.address}</td>
                  <td className="px-4 py-2">{p.units}</td>
                  <td className="px-4 py-2">{p.rentRange}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/properties/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Th({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <th className={`px-4 py-2 text-left font-semibold ${className}`}>{children}</th>
  );
}
