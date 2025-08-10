import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function ThankYou() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-slate-900 px-4">
      {/* motion wrapper only gets animation props; styling stays on inner div */}
      <motion.div {...fadeUp}>
        <div className="max-w-md text-center space-y-6 translate-y-[-40px]">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <h1 className="text-4xl font-bold text-blue-600">Thank You!</h1>
          </motion.div>

          {/* Paragraph */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <p className="text-lg text-slate-600">
              Your message has been sent successfully. We’ll get back to you within one
              business day.
            </p>
          </motion.div>

          {/* Button */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <div className="pt-4">
              <Link
                href="/"
                className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-block"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
