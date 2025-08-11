// components/NavBar.tsx
import Link from "next/link";
import { useRouter } from "next/router";

export default function NavBar() {
  const router = useRouter();

  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Q Property
        </Link>

        {/* Left nav */}
        <div className="hidden md:flex items-center gap-5 text-slate-700">
          <Link href="/properties" className={linkCls(router.pathname === "/properties")}>
            Properties
          </Link>
          <Link href="/tenants" className={linkCls(router.pathname === "/tenants")}>
            Tenants
          </Link>
          <Link href="/leases" className={linkCls(router.pathname === "/leases")}>
            Leases
          </Link>
          <Link href="/statements" className={linkCls(router.pathname === "/statements")}>
            Statements
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/start"
            className="px-4 py-2 rounded border border-slate-300 text-slate-800 hover:bg-slate-50"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function linkCls(active: boolean) {
  return active
    ? "font-medium text-slate-900"
    : "hover:text-slate-900";
}
