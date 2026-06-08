'use client';

import { motion } from 'framer-motion';

function WindowChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
      </div>
      {children}
    </div>
  );
}

function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: 'indigo' | 'emerald' | 'amber';
}) {
  const map = {
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/20',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${map[color]}`}
    >
      {children}
    </span>
  );
}

export function MockDashboard() {
  return (
    <WindowChrome>
      <div className="space-y-3">
        <div>
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-1.5 h-2.5 w-48 rounded bg-white/5" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="text-[10px] font-medium text-white/80">Search</div>
            <div className="mt-1 text-[9px] text-white/40">Find anything</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="text-[10px] font-medium text-white/80">Decisions</div>
            <div className="mt-1 text-[9px] text-white/40">Why we decided</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="text-[10px] font-medium text-white/80">Reflect</div>
            <div className="mt-1 text-[9px] text-white/40">Extract knowledge</div>
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}

export function MockSearch() {
  return (
    <WindowChrome>
      <div className="mb-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-[10px] text-white/40">how do we handle migrations</span>
      </div>
      <div className="space-y-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-white/80">Engineering Guidelines</span>
            <Badge color="indigo">policy</Badge>
          </div>
          <div className="mt-1 text-[9px] leading-relaxed text-white/50">
            All new backend services are written in TypeScript with NestJS...
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-white/80">Adopt PostgreSQL</span>
            <Badge color="emerald">decision</Badge>
          </div>
          <div className="mt-1 text-[9px] leading-relaxed text-white/50">
            Strong relational guarantees, team familiarity...
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}

export function MockReflect() {
  return (
    <WindowChrome>
      <div className="mb-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded bg-white/5" />
          <div className="h-1.5 w-5/6 rounded bg-white/5" />
          <div className="h-1.5 w-4/6 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <Badge color="indigo">fact</Badge>
          <span className="text-[10px] text-white/70">Company Vision</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <Badge color="emerald">decision</Badge>
          <span className="text-[10px] text-white/70">Switch to Qdrant</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <Badge color="amber">lesson</Badge>
          <span className="text-[10px] text-white/70">Embedding model cold start</span>
        </div>
      </div>
    </WindowChrome>
  );
}

const GRAPH_NODES = [
  // Knowledge (col 1)
  { id: 'k1', type: 'knowledge' as const, label: 'Company Vision', x: 80, y: 50 },
  { id: 'k2', type: 'knowledge' as const, label: 'Engineering Guidelines', x: 80, y: 110 },
  { id: 'k3', type: 'knowledge' as const, label: 'Q3 Goals', x: 80, y: 170 },
  // Decisions (col 2)
  { id: 'd1', type: 'decision' as const, label: 'Adopt PostgreSQL', x: 280, y: 80 },
  { id: 'd2', type: 'decision' as const, label: 'Switch to Qdrant', x: 280, y: 150 },
  // Lessons (col 3)
  { id: 'l1', type: 'lesson' as const, label: 'Embedding cold start', x: 480, y: 120 },
];

const GRAPH_EDGES = [
  { source: 'k2', target: 'd1', label: 'relates_to' },
  { source: 'l1', target: 'd2', label: 'derived_from' },
];

const NODE_COLOR: Record<string, string> = {
  knowledge: '#6366f1',
  decision: '#10b981',
  lesson: '#f59e0b',
};

export function MockGraph() {
  const nodeById = new Map(GRAPH_NODES.map((n) => [n.id, n]));

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-xl border border-white/10 bg-[#0f0f12] p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
        </div>
        <svg viewBox="0 0 560 220" className="w-full">
          {/* Edges */}
          {GRAPH_EDGES.map((e, i) => {
            const s = nodeById.get(e.source)!;
            const t = nodeById.get(e.target)!;
            return (
              <motion.g
                key={`${e.source}-${e.target}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.15 }}
              >
                <line
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              </motion.g>
            );
          })}

          {/* Nodes */}
          {GRAPH_NODES.map((n, i) => (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={7}
                fill={NODE_COLOR[n.type]}
                style={{ filter: `drop-shadow(0 0 5px ${NODE_COLOR[n.type]}50)` }}
              />
              <text
                x={n.x + (n.x < 200 ? 14 : n.x > 400 ? -14 : 14)}
                y={n.y + 4}
                textAnchor={n.x > 400 ? 'end' : 'start'}
                className="fill-white/80"
                style={{ fontSize: 11 }}
              >
                {n.label}
              </text>
              <text
                x={n.x + (n.x < 200 ? 14 : n.x > 400 ? -14 : 14)}
                y={n.y + 16}
                textAnchor={n.x > 400 ? 'end' : 'start'}
                className="fill-white/40"
                style={{ fontSize: 9 }}
              >
                {n.type}
              </text>
            </motion.g>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: NODE_COLOR.knowledge }} /> Knowledge</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: NODE_COLOR.decision }} /> Decision</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full" style={{ background: NODE_COLOR.lesson }} /> Lesson</span>
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
