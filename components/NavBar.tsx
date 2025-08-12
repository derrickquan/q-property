// components/NavBar.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getUser, logout, onAuthEvent } from "../lib/auth";

type User = ReturnType<typeof getUser>;

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState<User>(getUser());

  // Keep nav in sync with auth state
  useEffect(() => {
    const off = onAuthEvent(() => setUser(getUser()));
    return () => off();
  }, []);

  const loggedIn = !!user;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          {/* tiny square mark */}
          <span className="inline-block h-2.5 w-2.5 rounded bg-blue-600" />
          <Link href={loggedIn ? "/properties" : "/"} className="font-semibold">
            Q Property
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-6 text-slate-700">
          {/* When LOGGED OUT -> show Home */}
          {!loggedIn && (
            <Link
              href="/"
              className={router.pathname === "/" ? "font-semibold text-slate-900" : "hover:text-slate-900"}
            >
              Home
            </Link>
          )}

          {/* When LOGGED IN -> show app sections */}
          {loggedIn && (
            <>
              <Link
                href="/properties"
                className={router.pathname.startsWith("/properties") ? "font-semibold text-slate-900" : "hover:text-slate-900"}
              >
                Properties
              </Link>
              <Link
                href="/tenants"
                className={router.pathname.startsWith("/tenants") ? "font-semibold text-slate-900" : "hover:text-slate-900"}
              >
                Tenants
              </Link>
              <Link
                href="/leases"
                className={router.pathname.startsWith("/leases") ? "font-semibold text-slate-900" : "hover:text-slate-900"}
              >
                Leases
              </Link>
              <Link
                href="/statements"
                className={router.pathname.startsWith("/statements") ? "font-semibold text-slate-900" : "hover:text-slate-900"}
              >
                Statements
              </Link>
            </>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Logged OUT: show Login + Start free */}
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

          {/* Logged IN: show user + Logout */}
          {loggedIn && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">
                {user?.name ?? user?.email}
              </div>
              <button
                onClick={() => {
                  logout();
                  // Kick to landing after logout
                  router.push("/");
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
