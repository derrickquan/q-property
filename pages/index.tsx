import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold text-gray-800 mb-4"
      >
        Q Property
      </motion.h1>
      <p className="text-gray-600 text-lg text-center max-w-xl">
        Modern property management software for individual landlords with 1–20 units.
      </p>
    </div>
  );
}
