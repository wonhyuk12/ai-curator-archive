"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import type { Category } from "@/data/archive";
import { monogram, type Graph } from "@/lib/graph";

export const domId = (id: string) => `node-${id.replace(/\//g, "--")}`;

/** Collapsible vertical tree used below the md breakpoint. */
export function MobileTree({
  category,
  graph,
  expanded,
  selectedId,
  highlightId,
  onToggle,
  onSelectTool,
}: {
  category: Category;
  graph: Graph;
  expanded: Set<string>;
  selectedId: string | null;
  highlightId: string | null;
  onToggle: (id: string) => void;
  onSelectTool: (id: string) => void;
}) {
  const { accent } = category;
  const root = graph.get(category.slug)!;
  const rootOpen = expanded.has(root.id);

  return (
    <div className="relative px-4 pb-24 pt-4" style={{ ["--accent" as string]: accent }}>
      <motion.button
        type="button"
        onClick={() => onToggle(root.id)}
        whileTap={{ scale: 0.98 }}
        className="relative flex w-full items-center gap-4 rounded-[26px] px-5 py-5 text-left"
        style={{
          background: `radial-gradient(120% 140% at 20% 10%, #fff 0%, ${accent} 40%, ${accent}cc 100%)`,
          boxShadow: `0 0 50px ${accent}77`,
          color: "#050505",
        }}
      >
        <div className="flex-1">
          <div className="font-mono text-[10px] tracking-[0.2em] opacity-60">[{category.index}] ROOT</div>
          <div className="text-4xl font-extrabold tracking-[-0.04em]">{category.name}</div>
        </div>
        <motion.span animate={{ rotate: rootOpen ? 45 : 0 }} className="grid h-8 w-8 place-items-center rounded-full border border-black/30">
          <Plus className="h-4 w-4" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {rootOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
            className="relative ml-6 overflow-hidden border-l pl-5 pt-3"
            style={{ borderColor: `${accent}55` }}
          >
            {root.children.map((fid, i) => {
              const f = graph.get(fid)!;
              const open = expanded.has(fid);
              const Icon = f.field!.icon;
              return (
                <motion.li
                  key={fid}
                  id={domId(fid)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 26, delay: i * 0.04 }}
                  className="relative pb-3"
                >
                  <span className="absolute -left-5 top-8 h-px w-5" style={{ background: `${accent}55` }} />
                  <button
                    type="button"
                    onClick={() => onToggle(fid)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-xl ${highlightId === fid ? "node-highlight" : ""}`}
                    style={{
                      borderColor: open ? `${accent}99` : "rgba(255,255,255,0.1)",
                      background: open ? `linear-gradient(135deg, ${accent}1c, rgba(12,12,12,0.8) 60%)` : "rgba(14,14,14,0.7)",
                    }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border" style={{ borderColor: `${accent}55`, color: accent, background: `${accent}12` }}>
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-base font-bold text-white">{f.label}</span>
                      <span className="block font-mono text-[10px] tracking-[0.16em] text-white/45">
                        {f.labelEn} <span style={{ color: accent }}>·{String(f.children.length).padStart(2, "0")}</span>
                      </span>
                    </span>
                    <motion.span animate={{ rotate: open ? 90 : 0 }} style={{ color: open ? accent : "rgba(255,255,255,0.5)" }}>
                      <ChevronRight className="h-5 w-5" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 220, damping: 28 }}
                        className="ml-5 overflow-hidden border-l pl-4 pt-2"
                        style={{ borderColor: `${accent}40` }}
                      >
                        {f.children.map((tid) => {
                          const t = graph.get(tid)!;
                          const sel = selectedId === tid;
                          return (
                            <li key={tid} id={domId(tid)} className="relative pb-2">
                              <span className="absolute -left-4 top-7 h-px w-4" style={{ background: `${accent}40` }} />
                              <button
                                type="button"
                                onClick={() => onSelectTool(tid)}
                                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left ${highlightId === tid ? "node-highlight" : ""}`}
                                style={{
                                  borderColor: sel ? accent : "rgba(255,255,255,0.08)",
                                  background: sel ? `${accent}18` : "rgba(10,10,10,0.75)",
                                }}
                              >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg font-display text-sm font-bold text-black" style={{ background: `linear-gradient(145deg, ${accent}, ${accent}66)` }}>
                                  {monogram(t.label)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-bold text-white">{t.label}</span>
                                  <span className="block truncate text-xs text-white/50">{t.entry!.useCase}</span>
                                </span>
                                <span className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px]" style={{ borderColor: `${accent}55`, color: accent }}>
                                  #{t.entry!.tag}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
