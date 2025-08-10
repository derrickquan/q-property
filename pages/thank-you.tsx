import React from "react";
import Link from "next/link";

export default function ThankYou() {
  return (
    <main className="min-h-screen grid place-items-center bg-white text-slate-900 px-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-bold text-blue-600">Thank You!</h1>
        <p className="text-lg text-slate-600">
          Your message has been sent successfully. We’ll get back to you within one business day.
        </p>
        <Link href="/" className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
