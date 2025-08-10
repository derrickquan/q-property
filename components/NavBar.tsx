// components/NavBar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { pathname } = useRouter();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg transition-colors ${
        active ? "text-blue-700 font-semibold" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Simple keyhole/door icon */}
          <svg width={22} height={22} viewBox="0 0 64 64" aria-label="Q Property">
            <defs>
              <linearGradient id="qg-nav" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
            <rect x="8" y="6" width="48" height="52" rx="12" fill="url(#qg-nav)" />
            <circle cx="32" cy="34" r="4" fill="white" />
          </svg>
          <span className="font-semibold text-slate-900">Q Property</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/properties">Properties</NavLink>
          <NavLink href="/tenants">Tenants</NavLink>
          <NavLink href="/leases">Leases</NavLink>
          <NavLink href="/statements">Statements</NavLink>
        </nav>
      </div>
    </header>
  );
}
