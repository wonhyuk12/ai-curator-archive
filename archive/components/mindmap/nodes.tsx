"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { memo } from "react";
import type { Category } from "@/data/archive";
import { monogram, NODE_SIZE, type GNode } from "@/lib/graph";

export type MapNodeData = {
  g: GNode;
  category: Category;
  expanded: boolean;
  selected: boolean;
  highlight: boolean;
  onPath: boolean;
  dim: boolean;
};

export type MapNode = Node<MapNodeData>;

const spring = { type: "spring" as const, stiffness: 260, damping: 20 };

const Handles = () => (
  <>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </>
);

function Toggle({ expanded, accent, dark }: { expanded: boolean; accent: string; dark?: boolean }) {
  return (
    <motion.span
      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border"
      style={{
        borderColor: dark ? "rgba(0,0,0,0.35)" : expanded ? accent : "rgba(255,255,255,0.2)",
        color: dark ? "#050505" : expanded ? accent : "rgba(255,255,255,0.7)",
      }}
      animate={{ rotate: expanded ? 45 : 0 }}
      transition={spring}
    >
      <Plus className="h-3 w-3" strokeWidth={2} />
    </motion.span>
  );
}

/* ── Level 1: category root — big glowing pill ─────────────────── */
export const RootNode = memo(function RootNode({ data }: NodeProps<MapNode>) {
  const { category, expanded, highlight } = data;
  const { accent } = category;
  const { w, h } = NODE_SIZE.root;
  return (
    <motion.div
      data-accent={accent}
      data-cursor
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={`relative flex items-center gap-4 rounded-full px-6 ${highlight ? "node-highlight" : ""}`}
      style={{
        width: w,
        height: h,
        background: `radial-gradient(120% 140% at 30% 20%, #ffffff 0%, ${accent} 38%, ${accent}cc 100%)`,
        boxShadow: `0 0 0 1px ${accent}, 0 0 40px ${accent}aa, 0 0 120px ${accent}55, inset 0 -8px 24px rgba(0,0,0,0.25)`,
        color: "#050505",
        ["--accent" as string]: accent,
      }}
    >
      <Handles />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] font-medium tracking-[0.2em] opacity-60">
          [{category.index}] ROOT
        </div>
        <div className="truncate text-[28px] font-extrabold leading-tight tracking-[-0.04em]">{category.name}</div>
      </div>
      <Toggle expanded={expanded} accent={accent} dark />
    </motion.div>
  );
});

/* ── Level 2: sub-field — glass card ───────────────────────────── */
export const FieldNode = memo(function FieldNode({ data }: NodeProps<MapNode>) {
  const { g, category, expanded, highlight, onPath, dim } = data;
  const { accent } = category;
  const Icon = g.field!.icon;
  const { w, h } = NODE_SIZE.field;
  const lit = expanded || onPath;
  return (
    <motion.div
      data-accent={accent}
      data-cursor
      initial={{ scale: 0.6, opacity: 0, x: -30 }}
      animate={{ scale: 1, opacity: dim ? 0.45 : 1, x: 0 }}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={`group relative flex items-center gap-3 rounded-2xl border px-3.5 backdrop-blur-xl ${highlight ? "node-highlight" : ""}`}
      style={{
        width: w,
        height: h,
        borderColor: lit ? `${accent}aa` : "rgba(255,255,255,0.1)",
        background: lit ? `linear-gradient(135deg, ${accent}1f, rgba(12,12,12,0.75) 60%)` : "rgba(14,14,14,0.72)",
        boxShadow: lit ? `0 0 30px -6px ${accent}88, inset 0 0 20px ${accent}14` : "inset 0 1px 0 rgba(255,255,255,0.05)",
        ["--accent" as string]: accent,
      }}
    >
      <Handles />
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
        style={{ borderColor: `${accent}55`, background: `${accent}14`, color: accent, boxShadow: `inset 0 0 12px ${accent}22` }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[17px] font-bold tracking-[-0.02em] text-white">{g.label}</div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-[9.5px] tracking-[0.16em] text-white/45">
          <span className="truncate">{g.labelEn}</span>
          <span style={{ color: accent }}>·{String(g.children.length).padStart(2, "0")}</span>
        </div>
      </div>
      <Toggle expanded={expanded} accent={accent} />
    </motion.div>
  );
});

/* ── Level 3: tool — compact card ──────────────────────────────── */
export const ToolNode = memo(function ToolNode({ data }: NodeProps<MapNode>) {
  const { g, category, selected, highlight, dim } = data;
  const { accent } = category;
  const { w, h } = NODE_SIZE.tool;
  const entry = g.entry!;
  const tool = g.tool!;
  return (
    <motion.div
      data-accent={accent}
      data-cursor
      initial={{ scale: 0.6, opacity: 0, x: -40 }}
      animate={{ scale: 1, opacity: dim ? 0.4 : 1, x: 0 }}
      whileHover={{ scale: 1.035 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={`relative flex items-center gap-3 rounded-2xl border px-3 backdrop-blur-xl ${highlight ? "node-highlight" : ""}`}
      style={{
        width: w,
        height: h,
        borderColor: selected ? accent : "rgba(255,255,255,0.09)",
        background: selected ? `linear-gradient(135deg, ${accent}26, rgba(10,10,10,0.85) 70%)` : "rgba(10,10,10,0.78)",
        boxShadow: selected ? `0 0 0 1px ${accent}, 0 0 36px ${accent}77` : "inset 0 1px 0 rgba(255,255,255,0.04)",
        ["--accent" as string]: accent,
      }}
    >
      <Handles />
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-base font-bold tracking-tight"
        style={{
          background: `linear-gradient(145deg, ${accent}, ${accent}55 60%, #111)`,
          color: "#050505",
          boxShadow: `0 0 18px ${accent}44, inset 0 1px 0 rgba(255,255,255,0.4)`,
        }}
      >
        {monogram(tool.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-bold tracking-[-0.01em] text-white">{tool.name}</span>
          {tool.pricing === "Free" && (
            <span className="rounded-sm bg-white/10 px-1 font-mono text-[8px] tracking-wider text-white/70">FREE</span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-white/55">{entry.useCase}</div>
        <span
          className="mt-1.5 inline-block rounded-full border px-2 py-[1px] font-mono text-[9px] tracking-wider"
          style={{ borderColor: `${accent}55`, color: accent, background: `${accent}10` }}
        >
          #{entry.tag}
        </span>
      </div>
    </motion.div>
  );
});

export const nodeTypes = { root: RootNode, field: FieldNode, tool: ToolNode };
