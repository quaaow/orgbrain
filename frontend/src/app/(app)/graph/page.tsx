'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/components/session-provider';
import { Badge, Card, SkeletonCard } from '@/components/ui';
import { FadeIn } from '@/components/motion';
import { api } from '@/lib/api';
import type { GraphData, GraphNode, GraphNodeType } from '@/lib/types';

const NODE_COLOR: Record<GraphNodeType, string> = {
  knowledge: '#6366f1',
  decision: '#10b981',
  lesson: '#f59e0b',
};

const ROW_H = 46;
const TOP = 48;
const COL_W = 300;
const LEFT = 140;

interface Positioned extends GraphNode {
  x: number;
  y: number;
}

export default function GraphPage() {
  const { activeOrgId } = useSession();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const g = await api.get<GraphData>('/graph', activeOrgId);
    setData(g);
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { positioned, byId, height, width } = useMemo(() => {
    const cols: Record<GraphNodeType, number> = {
      knowledge: 0,
      decision: 0,
      lesson: 0,
    };
    const colOrder: GraphNodeType[] = ['knowledge', 'decision', 'lesson'];
    const pos: Positioned[] = (data?.nodes ?? []).map((n) => {
      const idx = cols[n.type]++;
      const colIndex = colOrder.indexOf(n.type);
      return { ...n, x: LEFT + colIndex * COL_W, y: TOP + idx * ROW_H };
    });
    const map = new Map(pos.map((p) => [p.id, p]));
    const maxRows = Math.max(1, cols.knowledge, cols.decision, cols.lesson);
    return {
      positioned: pos,
      byId: map,
      height: TOP + maxRows * ROW_H + 20,
      width: LEFT + 2 * COL_W + 60,
    };
  }, [data]);

  if (!activeOrgId) {
    return <p className="text-white/50">Select or create an organisation first.</p>;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge graph</h1>
            <p className="mt-1 text-white/50">
              How facts, decisions and lessons connect.
            </p>
          </div>
          {data && (
            <div className="text-sm text-white/50">
              {data.counts.nodes} nodes · {data.counts.edges} edges
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-3 text-xs">
          <Legend color={NODE_COLOR.knowledge} label="Knowledge" />
          <Legend color={NODE_COLOR.decision} label="Decision" />
          <Legend color={NODE_COLOR.lesson} label="Lesson" />
        </div>
      </FadeIn>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !data || data.nodes.length === 0 ? (
        <FadeIn delay={0.2}>
          <p className="text-sm text-white/40">
            Nothing to show yet. Add knowledge or run Reflect to build the graph.
          </p>
        </FadeIn>
      ) : (
        <FadeIn delay={0.2}>
          <Card className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full"
              style={{ minWidth: Math.min(width, 600), height }}
              preserveAspectRatio="xMidYMin meet"
            >
              {data.edges.map((e, i) => {
                const s = byId.get(e.source);
                const t = byId.get(e.target);
                if (!s || !t) return null;
                const mx = (s.x + t.x) / 2;
                const my = (s.y + t.y) / 2;
                return (
                  <motion.g
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                  >
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth={1.5}
                    />
                    <text
                      x={mx}
                      y={my - 4}
                      textAnchor="middle"
                      className="fill-white/35"
                      style={{ fontSize: 9 }}
                    >
                      {e.relation}
                    </text>
                  </motion.g>
                );
              })}
              {positioned.map((n, i) => (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
                  className="cursor-pointer"
                >
                  <title>{n.label}</title>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={7}
                    fill={NODE_COLOR[n.type]}
                    className="transition-all duration-200 hover:r-10"
                    style={{ filter: 'drop-shadow(0 0 4px ' + NODE_COLOR[n.type] + '40)' }}
                  />
                  <text
                    x={n.x + 14}
                    y={n.y + 4}
                    className="fill-white/80 select-none"
                    style={{ fontSize: 11 }}
                  >
                    {n.label.length > 34 ? n.label.slice(0, 34) + '…' : n.label}
                  </text>
                </motion.g>
              ))}
            </svg>
          </Card>
        </FadeIn>
      )}

      {data && data.nodes.length > 0 && (
        <FadeIn delay={0.3}>
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-white/70">Edges</h2>
            {data.edges.length === 0 ? (
              <p className="text-sm text-white/40">
                No links yet. Reflect auto-links lessons to their decisions.
              </p>
            ) : (
              <div className="space-y-1.5">
                {data.edges.map((e) => {
                  const s = byId.get(e.source);
                  const t = byId.get(e.target);
                  return (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center gap-2 text-sm text-white/70"
                    >
                      <Badge>{s?.type ?? e.source_type}</Badge>
                      <span className="max-w-[150px] truncate sm:max-w-[200px]">
                        {s?.label ?? e.source.slice(0, 8)}
                      </span>
                      <span className="text-white/40">—{e.relation}→</span>
                      <Badge>{t?.type ?? e.target_type}</Badge>
                      <span className="max-w-[150px] truncate sm:max-w-[200px]">
                        {t?.label ?? e.target.slice(0, 8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </FadeIn>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-white/60">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
