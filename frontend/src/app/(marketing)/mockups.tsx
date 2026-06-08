'use client';

import { motion } from 'framer-motion';

export function MockDashboard() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-400/60" />
        <div className="h-2 w-2 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
      </div>
      <div className="space-y-3">
        <div className="h-6 w-1/3 rounded bg-white/10" />
        <div className="h-4 w-2/3 rounded bg-white/5" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="h-3 w-12 rounded bg-white/10" />
            <div className="mt-2 h-2 w-full rounded bg-white/5" />
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="h-3 w-14 rounded bg-white/10" />
            <div className="mt-2 h-2 w-full rounded bg-white/5" />
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="h-3 w-10 rounded bg-white/10" />
            <div className="mt-2 h-2 w-full rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockSearch() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-400/60" />
        <div className="h-2 w-2 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
      </div>
      <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <div className="h-3 w-1/2 rounded bg-white/10" />
      </div>
      <div className="space-y-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <div className="h-3 w-1/3 rounded bg-white/10" />
          <div className="mt-2 h-2 w-full rounded bg-white/5" />
          <div className="mt-1 h-2 w-2/3 rounded bg-white/5" />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <div className="h-3 w-1/4 rounded bg-white/10" />
          <div className="mt-2 h-2 w-full rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function MockReflect() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-400/60" />
        <div className="h-2 w-2 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-emerald-400/60" />
      </div>
      <div className="mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-4">
        <div className="h-2 w-full rounded bg-white/5" />
        <div className="mt-2 h-2 w-5/6 rounded bg-white/5" />
        <div className="mt-2 h-2 w-4/6 rounded bg-white/5" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300">fact</div>
          <div className="h-2 flex-1 rounded bg-white/5" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <div className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">decision</div>
          <div className="h-2 flex-1 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function FloatingMockups() {
  return (
    <div className="relative mx-auto mt-16 hidden h-[340px] max-w-4xl sm:block sm:h-[400px]">
      <motion.div
        className="absolute left-[5%] top-[10%] w-[55%] sm:left-[8%] sm:w-[45%]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <MockDashboard />
      </motion.div>
      <motion.div
        className="absolute right-[5%] top-[5%] w-[50%] sm:right-[10%] sm:w-[40%]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
      >
        <MockSearch />
      </motion.div>
      <motion.div
        className="absolute bottom-[5%] left-[15%] w-[55%] sm:left-[20%] sm:w-[45%]"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.7 }}
      >
        <MockReflect />
      </motion.div>
    </div>
  );
}
