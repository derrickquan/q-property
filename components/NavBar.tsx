// components/NavBar.tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getUser, onAuthChange, logout, type AuthUser } from "../lib/auth";

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);

  // Hydrate from localStorage and keep in sync
  React.useEffect(() => {
    setUser(getUser());
    const off = onAuthChange(() => setUser(getUser()));
    return off;
  }, []);

  const active = (path: string) =>
    router.pathname === path ? "text-slate-900 font-semibold" : "text-slate-600 hover:text-slate-900";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
        {/* Left: brand + primary nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 64 64" aria-label="Q Property logo">
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

          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link href="/" className={active("/")}>Home</Link>
            <Link href="/properties" className={active("/properties")}>Properties</Link>
            <Link href="/tenants" className={active("/tenants")}>Tenants</Link>
            <Link href="/leases" className={active("/leases")}>Leases</Link>
            <Link href="/statements" className={active("/statements")}>Statements</Link>
          </nav>
        </div>

        {/* Right: auth area */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-slate-600 mr-2">
                Hi, <span className="font-medium text-slate-900">{user.name}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  // optional: kick back to home after logout
                  if (router.pathname !== "/") router.push("/");
                }}
                className="px-3 py-2 rounded border border-slate-300 text-slate-900 hover:bg-slate-50 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 rounded border border-slate-300 text-slate-900 hover:bg-slate-50 text-sm"
              >
                Login
              </Link>
              <Link
                href="/start"
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
