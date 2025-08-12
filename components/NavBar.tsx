// components/NavBar.tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getUser, logout, onAuthEvent, type AuthUser } from "../lib/auth";

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);

  // hydrate + keep in sync with auth events (login/logout/update)
  React.useEffect(() => {
    setUser(getUser());
    const off = onAuthEvent(() => setUser(getUser()));
    return off;
  }, []);

  const loggedIn = !!user;

  const displayName =
    (user?.firstName || user?.lastName)
      ? [user?.firstName, user?.lastName].filter(Boolean).join(" ")
      : (user?.email ?? "");

  const linkCls = (active: boolean) =>
    active ? "font-semibold text-slate-900" : "text-slate-700 hover:text-slate-900";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded bg-blue-600" />
          <Link href={loggedIn ? "/properties" : "/"} className="font-semibold">
            Q Property
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-6">
          {/* Logged OUT: show Home */}
          {!loggedIn && (
            <Link href="/" className={linkCls(router.pathname === "/")}>
              Home
            </Link>
          )}

          {/* Logged IN: show app sections */}
          {loggedIn && (
            <>
              <Link href="/properties" className={linkCls(router.pathname.startsWith("/properties"))}>
                Properties
              </Link>
              <Link href="/tenants" className={linkCls(router.pathname.startsWith("/tenants"))}>
                Tenants
              </Link>
              <Link href="/leases" className={linkCls(router.pathname.startsWith("/leases"))}>
                Leases
              </Link>
              <Link href="/statements" className={linkCls(router.pathname.startsWith("/statements"))}>
                Statements
              </Link>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Logged OUT: Login + Start free */}
          {!loggedIn && (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                href="/start"
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Start free
              </Link>
            </>
          )}

          {/* Logged IN: greeting + Logout */}
          {loggedIn && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">{displayName}</div>
              <button
                onClick={() => {
                  logout();
                  router.push("/"); // return to landing after logout
                }}
                className="px-3 py-1.5 text-sm rounded border border-slate-300 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
