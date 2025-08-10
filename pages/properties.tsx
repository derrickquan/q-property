import React, { useEffect, useState } from "react";
import type { Property } from "../lib/types";
import { load, save } from "../lib/storage";
import Link from "next/link";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const stored = load<Property[]>("properties") || [];
    const mockData: Property[] = [
      {
        id: "mock1",
        name: "Maplewood Apartments",
        address1: "1234 Elm Street",
        address2: "Los Angeles, CA",
        unitCount: 12,
        type: "apartment",
        notes: "Close to downtown and metro line.",
      },
      {
        id: "mock2",
        name: "Sunset Villas",
        address1: "987 Palm Drive",
        address2: "Beverly Hills, CA",
        unitCount: 8,
        type: "condo",
        notes: "Luxury units with ocean views.",
      },
      {
        id: "mock3",
        name: "Oakwood Townhomes",
        address1: "555 Oak Lane",
        address2: "Pasadena, CA",
        unitCount: 10,
        type: "townhouse",
        notes: "Family-friendly community near park.",
      },
    ];
    setProperties([...mockData, ...stored]);
  }, []);

  function handleDelete(id: string) {
    const filtered = properties.filter((p) => p.id !== id);
    setProperties(filtered);
    save("properties", filtered);
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Properties</h1>
        <Link
          href="/add-property"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Property
        </Link>
      </div>

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300">
            <Th>Name</Th>
            <Th>Address</Th>
            <Th>Units</Th>
            <Th>Type</Th>
            <Th>Notes</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.id} className="border-b border-gray-200">
              <Td>{p.name}</Td>
              <Td>
                {p.address1}
                <br />
                {p.address2}
              </Td>
              <Td className="text-right">{p.unitCount}</Td>
              <Td className="capitalize">{p.type}</Td>
              <Td
                className="max-w-[240px] truncate"
                title={p.notes ?? ""}
              >
                {p.notes ?? "—"}
              </Td>
              <Td className="text-right pr-4">
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function Th({ children }: React.PropsWithChildren) {
  return (
    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  ...rest
}: React.PropsWithChildren<
  { className?: string } & React.TdHTMLAttributes<HTMLTableCellElement>
>) {
  return (
    <td {...rest} className={`px-4 py-2 align-top ${className}`}>
      {children}
    </td>
  );
}
