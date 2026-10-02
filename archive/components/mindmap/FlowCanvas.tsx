"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  useStore,
  useViewport,
  type NodeMouseHandler,
} from "@xyflow/react";
import { animate, useReducedMotion, type AnimationPlaybackControls } from "framer-motion";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Category } from "@/data/archive";
import { ancestors, layoutTree, NODE_SIZE, visibleIds, type Graph, type Pos } from "@/lib/graph";
import { edgeTypes, type FlowEdgeType } from "./FlowEdge";
import { nodeTypes, type MapNode } from "./nodes";

export type ViewRequest =
  | { kind: "fit"; nonce: number }
  | { kind: "nodes"; ids: string[]; nonce: number }
  | { kind: "center"; id: string; nonce: number };

type Anim = { x: number; y: number; o: number };

export function FlowCanvas({
  category,
  graph,
  expanded,
  selectedId,
  highlightId,
  view,
  rightInset,
  onToggle,
  onSelectTool,
  onPaneClick,
}: {
  category: Category;
  graph: Graph;
  expanded: Set<string>;
  selectedId: string | null;
  highlightId: string | null;
  view: ViewRequest;
  rightInset: number;
  onToggle: (id: string) => void;
  onSelectTool: (id: string) => void;
  onPaneClick: () => void;
}) {
  const rf = useReactFlow<MapNode, FlowEdgeType>();
  const reduce = useReducedMotion();
  const { accent } = category;

  const current = useRef(new Map<string, Anim>());
  const target = useRef(new Map<string, Pos>());
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const [display, setDisplay] = useState<Map<string, Anim>>(() => new Map());
  const [ready, setReady] = useState(false);
  const paneW = useStore((s) => s.width);
  const paneH = useStore((s) => s.height);

  /* ── Layout + spring transition whenever the visible set changes ── */
  useEffect(() => {
    const ids = visibleIds(graph, category.slug, expanded);
    const next = layoutTree(graph, ids);
    const prev = new Map(current.current);
    const from = new Map<string, Anim>();
    const to = new Map<string, Anim>();

    const nearestVisible = (id: string) => {
      const chain = ancestors(graph, id).reverse();
      return chain.find((a) => next.has(a)) ?? category.slug;
    };

    for (const id of ids) {
      const t = next.get(id)!;
      to.set(id, { ...t, o: 1 });
      const p = prev.get(id);
      if (p) from.set(id, p);
      else {
        const parent = graph.get(id)!.parent;
        const origin = (parent && (prev.get(parent) ?? next.get(parent))) || t;
        from.set(id, { x: origin.x, y: origin.y, o: 0 });
      }
    }
    for (const [id, p] of prev) {
      if (next.has(id)) continue;
      const anchor = next.get(nearestVisible(id))!;
      from.set(id, p);
      to.set(id, { x: anchor.x, y: anchor.y, o: 0 });
    }

    target.current = next;
    controls.current?.stop();

    const apply = (t: number) => {
      const map = new Map<string, Anim>();
      const k = Math.min(1, Math.max(0, t));
      for (const [id, a] of from) {
        const b = to.get(id)!;
        map.set(id, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, o: a.o + (b.o - a.o) * k });
      }
      current.current = map;
      setDisplay(map);
    };

    const finish = () => {
      const map = new Map<string, Anim>();
      for (const id of ids) map.set(id, { ...next.get(id)!, o: 1 });
      current.current = map;
      setDisplay(map);
    };

    if (reduce) {
      finish();
      return;
    }
    controls.current = animate(0, 1, {
      type: "spring",
      stiffness: 140,
      damping: 19,
      mass: 0.9,
      onUpdate: apply,
      onComplete: finish,
    });
    return () => controls.current?.stop();
  }, [graph, expanded, category.slug, reduce]);

  /* ── Camera requests, computed from the *target* layout so camera and nodes move together ── */
  const lastView = useRef(-1);
  useEffect(() => {
    if (!ready || view.nonce === lastView.current) return;
    lastView.current = view.nonce;
    const t = target.current;
    const bounds = (ids: string[]) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const id of ids) {
        const p = t.get(id);
        if (!p) continue;
        const { w, h } = NODE_SIZE[graph.get(id)!.kind];
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
        x1 = Math.max(x1, p.x + w); y1 = Math.max(y1, p.y + h);
      }
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    };
    const duration = reduce ? 0 : 900;
    // Keep targets clear of the detail panel when it's open.
    const inset = rightInset;
    const fitTo = (b: ReturnType<typeof bounds>, padding: number, maxZoom: number) => {
      if (!Number.isFinite(b.x)) return;
      const zoom = Math.min(maxZoom, ((paneW - inset) * (1 - padding)) / b.width, (paneH * (1 - padding)) / b.height);
      rf.setCenter(b.x + b.width / 2 + inset / 2 / zoom, b.y + b.height / 2, { zoom, duration });
    };
    const run = () => {
      if (view.kind === "fit") fitTo(bounds([...t.keys()]), 0.14, 1);
      else if (view.kind === "nodes") fitTo(bounds(view.ids), 0.2, 1.05);
      else {
        const p = t.get(view.id);
        if (!p) return;
        const { w, h } = NODE_SIZE[graph.get(view.id)!.kind];
        const zoom = 1.1;
        rf.setCenter(p.x + w / 2 + inset / 2 / zoom, p.y + h / 2, { zoom, duration });
      }
    };
    const id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
    // Camera reacts to new requests only; pane size / inset are read at request time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ready, rf, graph, reduce]);

  /* ── Derived nodes / edges for this frame ── */
  const path = new Set(selectedId ? [...ancestors(graph, selectedId), selectedId] : []);
  const nodes: MapNode[] = [];
  const edges: FlowEdgeType[] = [];
  let seed = 0;
  for (const [id, a] of display) {
    const g = graph.get(id)!;
    nodes.push({
      id,
      type: g.kind,
      position: { x: a.x, y: a.y },
      width: NODE_SIZE[g.kind].w,
      height: NODE_SIZE[g.kind].h,
      style: { opacity: a.o, pointerEvents: a.o < 0.5 ? "none" : undefined },
      draggable: false,
      selectable: false,
      data: {
        g,
        category,
        expanded: expanded.has(id),
        selected: id === selectedId,
        highlight: id === highlightId,
        onPath: path.has(id),
        dim: selectedId !== null && !path.has(id) && g.kind !== "root",
      },
    });
    if (g.parent && display.has(g.parent)) {
      edges.push({
        id: `e:${id}`,
        source: g.parent,
        target: id,
        type: "flow",
        data: { accent, opacity: a.o, active: path.has(id), seed: seed++ },
      });
    }
  }

  const onNodeClick: NodeMouseHandler<MapNode> = useCallback(
    (_, n) => {
      if (n.data.g.kind === "tool") onSelectTool(n.id);
      else onToggle(n.id);
    },
    [onSelectTool, onToggle],
  );

  return (
    <ReactFlow<MapNode, FlowEdgeType>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onInit={() => setReady(true)}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      minZoom={0.15}
      maxZoom={2.2}
      zoomOnDoubleClick={false}
      proOptions={{ hideAttribution: false }}
      colorMode="dark"
      className="!bg-transparent"
    >
      <Background id="dots" variant={BackgroundVariant.Dots} gap={26} size={1.1} color="rgba(255,255,255,0.14)" />
      <Background id="major" variant={BackgroundVariant.Lines} gap={260} lineWidth={0.5} color="rgba(255,255,255,0.035)" />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        nodeBorderRadius={12}
        maskColor="rgba(5,5,5,0.72)"
        maskStrokeColor={accent}
        maskStrokeWidth={1}
        nodeColor={(n) => (n.type === "root" ? accent : n.type === "field" ? `${accent}aa` : "rgba(255,255,255,0.35)")}
        nodeStrokeWidth={0}
        style={{ width: 200, height: 130 }}
      />
      <Panel position="bottom-left" className="!m-4">
        <Hud accent={accent} />
      </Panel>
    </ReactFlow>
  );
}

function Hud({ accent }: { accent: string }) {
  const { x, y, zoom } = useViewport();
  const rf = useReactFlow();
  const btn =
    "grid h-9 w-9 place-items-center text-white/70 transition-colors hover:bg-white/10 hover:text-white";
  return (
    <div className="flex items-center gap-3" data-accent={accent}>
      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl">
        <button type="button" aria-label="축소" className={btn} onClick={() => rf.zoomOut({ duration: 300 })}>
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="전체 보기" className={`${btn} border-x border-white/10`} onClick={() => rf.fitView({ padding: 0.18, duration: 700 })}>
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="확대" className={btn} onClick={() => rf.zoomIn({ duration: 300 })}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="hidden font-mono text-[10px] leading-4 tracking-[0.15em] text-white/40 md:block">
        <div>
          ZOOM <span style={{ color: accent }}>{Math.round(zoom * 100)}%</span>
        </div>
        <div className="tabular-nums">
          X {(-x).toFixed(0).padStart(5, " ")} · Y {(-y).toFixed(0).padStart(5, " ")}
        </div>
      </div>
    </div>
  );
}
