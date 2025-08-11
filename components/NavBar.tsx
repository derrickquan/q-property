import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold">
          Q Property
        </Link>

        {/* Menu links */}
        <div className="flex items-center gap-4">
          <Link href="/properties" className="hover:underline">Properties</Link>
          <Link href="/tenants" className="hover:underline">Tenants</Link>
          <Link href="/leases" className="hover:underline">Leases</Link>
          <Link href="/statements" className="hover:underline">Statements</Link>

          {/* Right side buttons */}
          <Link
            href="/login"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Login
          </Link>
          <Link
            href="/start"
            className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}
