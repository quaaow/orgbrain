'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const ROW_H = 52;
const TOP = 56;
const COL_W = 320;
const LEFT = 160;

interface Positioned extends GraphNode {
  x: number;
  y: number;
}

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function GraphPage() {
  const { activeOrgId } = useSession();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<{ left: number; top: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
      height: TOP + maxRows * ROW_H + 30,
      width: LEFT + 2 * COL_W + 80,
    };
  }, [data]);

  const hoveredNode = useMemo(
    () => positioned.find((n) => n.id === hoveredNodeId) ?? null,
    [hoveredNodeId, positioned],
  );

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Zoom / Pan state
  const [viewBox, setViewBox] = useState<ViewBox>({ x: 0, y: 0, w: width, h: height });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, vbX: 0, vbY: 0 });

  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: width, h: height });
  }, [width, height]);

  const zoom = useCallback(
    (factor: number, centerX?: number, centerY?: number) => {
      setViewBox((prev) => {
        const cx = centerX ?? prev.x + prev.w / 2;
        const cy = centerY ?? prev.y + prev.h / 2;
        const newW = Math.max(200, prev.w * factor);
        const newH = Math.max(150, prev.h * factor);
        return {
          x: cx - (newW * (cx - prev.x)) / prev.w,
          y: cy - (newH * (cy - prev.y)) / prev.h,
          w: newW,
          h: newH,
        };
      });
    },
    [],
  );

  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: width, h: height });
  }, [width, height]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const pt = svg.createSVGPoint();
      pt.x = e.clientX - rect.left;
      pt.y = e.clientY - rect.top;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      zoom(factor, svgP.x, svgP.y);
    },
    [zoom],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, vbX: viewBox.x, vbY: viewBox.y };
  }, [viewBox]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      setViewBox((prev) => ({
        ...prev,
        x: dragStart.current.vbX - (e.clientX - dragStart.current.x) * scaleX,
        y: dragStart.current.vbY - (e.clientY - dragStart.current.y) * scaleY,
      }));
    },
    [viewBox],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Connected edges and nodes for hovered node
  const { connectedEdgeIds, connectedNodeIds } = useMemo(() => {
    if (!hoveredNodeId || !data) {
      return { connectedEdgeIds: new Set<string>(), connectedNodeIds: new Set<string>() };
    }
    const edgeIds = new Set<string>();
    const nodeIds = new Set<string>();
    for (const e of data.edges) {
      if (e.source === hoveredNodeId || e.target === hoveredNodeId) {
        edgeIds.add(e.id);
        nodeIds.add(e.source);
        nodeIds.add(e.target);
      }
    }
    return { connectedEdgeIds: edgeIds, connectedNodeIds: nodeIds };
  }, [hoveredNodeId, data]);

  // Compute tooltip position in container pixels
  const computeTooltipPos = useCallback(
    (nx: number, ny: number) => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return null;
      const containerRect = container.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / viewBox.w;
      const scaleY = svgRect.height / viewBox.h;
      const px = (nx - viewBox.x) * scaleX;
      const py = (ny - viewBox.y) * scaleY;
      return {
        x: px + (svgRect.left - containerRect.left),
        y: py + (svgRect.top - containerRect.top),
      };
    },
    [viewBox],
  );

  const handleNodeEnter = useCallback(
    (n: Positioned) => {
      setHoveredNodeId(n.id);
      const pos = computeTooltipPos(n.x, n.y);
      setTooltipPos(pos);
    },
    [computeTooltipPos],
  );

  const handleNodeLeave = useCallback(() => {
    setHoveredNodeId(null);
    setTooltipPos(null);
  }, []);

  // Recalculate tooltip position on zoom/pan while hovered
  useEffect(() => {
    if (hoveredNode) {
      const pos = computeTooltipPos(hoveredNode.x, hoveredNode.y);
      setTooltipPos(pos);
    }
  }, [hoveredNode, viewBox, computeTooltipPos]);

  // Tooltip smart positioning
  useEffect(() => {
    if (!tooltipPos || !containerRef.current) {
      setTooltipStyle(null);
      return;
    }
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const tooltipW = 260;
    const tooltipH = 160;
    let left = tooltipPos.x + 18;
    let top = tooltipPos.y + 18;
    if (left + tooltipW > containerW) left = tooltipPos.x - tooltipW - 18;
    if (top + tooltipH > containerH) top = tooltipPos.y - tooltipH - 18;
    setTooltipStyle({ left, top });
  }, [tooltipPos]);

  if (!activeOrgId) {
    return <p className="text-white/50">Select or create an organisation first.</p>;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge graph</h1>
            <p className="mt-1 text-white/50">How facts, decisions and lessons connect.</p>
          </div>
          {data && (
            <div className="text-sm text-white/50">
              {data.counts.nodes} nodes · {data.counts.edges} edges
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-xs">
            <Legend color={NODE_COLOR.knowledge} label="Knowledge" />
            <Legend color={NODE_COLOR.decision} label="Decision" />
            <Legend color={NODE_COLOR.lesson} label="Lesson" />
          </div>
          {data && data.nodes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => zoom(0.9)}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
                title="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => zoom(1.1)}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
                title="Zoom out"
              >
                −
              </button>
              <button
                onClick={resetView}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
                title="Reset view"
              >
                Reset
              </button>
              <button
                onClick={toggleFullscreen}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-white/70 transition-colors hover:bg-white/10"
                title="Fullscreen"
              >
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
          )}
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
          <Card
            ref={containerRef}
            className={`relative overflow-hidden bg-[#0a0a0b] ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''}`}
          >
            <svg
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
              className={`w-full cursor-grab active:cursor-grabbing ${isFullscreen ? 'h-screen' : ''}`}
              style={{ minWidth: Math.min(width, 600), height: isFullscreen ? '100vh' : height }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Grid dots */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.04)" />
              </pattern>
              <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid)" />

              {/* Edges */}
              {data.edges.map((e, i) => {
                const s = byId.get(e.source);
                const t = byId.get(e.target);
                if (!s || !t) return null;
                const isConnected = hoveredNodeId && connectedEdgeIds.has(e.id);
                const isDimmed = hoveredNodeId && !connectedEdgeIds.has(e.id);
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
                      stroke={isConnected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'}
                      strokeWidth={isConnected ? 2.5 : 1.5}
                      style={{ transition: 'all 0.2s', opacity: isDimmed ? 0.15 : 1 }}
                    />
                    <text
                      x={mx}
                      y={my - 5}
                      textAnchor="middle"
                      className="select-none"
                      style={{
                        fontSize: 9,
                        fill: isConnected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.2s',
                        opacity: isDimmed ? 0.15 : 1,
                      }}
                    >
                      {e.relation}
                    </text>
                  </motion.g>
                );
              })}

              {/* Nodes */}
              {positioned.map((n, i) => {
                const isHovered = hoveredNodeId === n.id;
                const isConnected = hoveredNodeId
                  ? n.id === hoveredNodeId || connectedNodeIds.has(n.id)
                  : false;
                const isDimmed = hoveredNodeId
                  ? !isConnected && n.id !== hoveredNodeId
                  : false;
                return (
                  <motion.g
                    key={n.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
                    className="cursor-pointer"
                    onMouseEnter={() => handleNodeEnter(n)}
                    onMouseLeave={handleNodeLeave}
                  >
                    {/* Glow ring on hover */}
                    {isHovered && (
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={14}
                        fill="none"
                        stroke={NODE_COLOR[n.type]}
                        strokeWidth={1}
                        opacity={0.3}
                      />
                    )}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isHovered ? 9 : 7}
                      fill={NODE_COLOR[n.type]}
                      style={{
                        filter: `drop-shadow(0 0 ${isHovered ? 8 : 4}px ${NODE_COLOR[n.type]}60)`,
                        transition: 'all 0.2s',
                        opacity: isDimmed ? 0.2 : 1,
                      }}
                    />
                    <text
                      x={n.x + 14}
                      y={n.y + 4}
                      className="select-none"
                      style={{
                        fontSize: 12,
                        fill: isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
                        fontWeight: isHovered ? 500 : 400,
                        transition: 'all 0.2s',
                        opacity: isDimmed ? 0.2 : 1,
                      }}
                    >
                      {n.label.length > 36 ? n.label.slice(0, 36) + '…' : n.label}
                    </text>
                  </motion.g>
                );
              })}
            </svg>

            {/* HTML Tooltip */}
            {hoveredNode && tooltipStyle && (
              <div
                className="pointer-events-none absolute z-10 w-[260px] rounded-lg border border-white/10 bg-[#0f0f12]/95 p-3 shadow-2xl backdrop-blur-md"
                style={tooltipStyle}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: NODE_COLOR[hoveredNode.type] }}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-white/50">
                    {hoveredNode.type}
                  </span>
                  {hoveredNode.subtype && (
                    <span className="ml-auto text-[10px] text-white/30">{hoveredNode.subtype}</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm font-medium leading-snug text-white/90">
                  {hoveredNode.label}
                </div>
                {hoveredNode.content && (
                  <div className="mt-1.5 text-[11px] leading-relaxed text-white/50 line-clamp-5">
                    {hoveredNode.content}
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-white/30">
              Scroll to zoom · Drag to pan
            </div>
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
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
