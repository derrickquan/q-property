// pages/statements.tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function StatementsPage() {
  const { query } = useRouter();
  const tenantId = typeof query.tenant === "string" ? query.tenant : undefined;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Statements</h1>
      {tenantId ? (
        <p className="text-slate-600 mb-6">
          Showing statements for tenant: <b>{tenantId}</b> (placeholder)
        </p>
      ) : (
        <p className="text-slate-600 mb-6">Statements inbox/export (placeholder)</p>
      )}

      <div className="flex gap-3">
        <Link
          href="/tenants"
          className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
        >
          Back to Tenants
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
