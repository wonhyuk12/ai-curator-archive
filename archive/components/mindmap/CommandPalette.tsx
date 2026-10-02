"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ARCHIVE, type Category } from "@/data/archive";
import { buildGraph, monogram, type GNode } from "@/lib/graph";

type Hit = { node: GNode; category: Category };

type Props = {
  open: boolean;
  category: Category;
  onClose: () => void;
  onPick: (nodeId: string, slug: string) => void;
};

export function CommandPalette({ open, ...rest }: Props) {
  // Mounting the dialog fresh on every open resets its query/selection.
  return <AnimatePresence>{open && <PaletteDialog {...rest} />}</AnimatePresence>;
}

function PaletteDialog({ category, onClose, onPick }: Omit<Props, "open">) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const all = useMemo<Hit[]>(() => {
    // current category first, then the rest of the archive
    const ordered = [category, ...ARCHIVE.filter((c) => c.slug !== category.slug)];
    return ordered.flatMap((c) => [...buildGraph(c).values()].filter((n) => n.kind !== "root").map((node) => ({ node, category: c })));
  }, [category]);

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.filter((h) => h.category.slug === category.slug).slice(0, 40);
    return all
      .filter(({ node }) =>
        [node.label, node.labelEn, node.entry?.useCase, node.entry?.tag, node.field?.name].some((v) => v?.toLowerCase().includes(s)),
      )
      .slice(0, 40);
  }, [q, all, category.slug]);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (h: Hit | undefined) => {
    if (!h) return;
    onPick(h.node.id, h.category.slug);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(hits.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(hits[active]);
    } else if (e.key === "Escape") onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label="노드 검색"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b]/90 backdrop-blur-2xl"
        style={{ boxShadow: `0 0 100px -30px ${category.accent}, inset 0 1px 0 rgba(255,255,255,0.06)` }}
        initial={{ y: -20, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -10, scale: 0.97, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5">
          <Search className="h-4 w-4 text-white/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder="툴, 분야, 용도로 검색…  (예: 자막, Claude, 배포)"
            className="h-14 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/30"
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
          />
          <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/40">ESC</kbd>
        </div>
        <div ref={listRef} id="palette-list" role="listbox" className="thin-scroll max-h-[50vh] overflow-y-auto p-2">
          {hits.length === 0 && <div className="px-4 py-10 text-center font-mono text-xs tracking-widest text-white/35">NO MATCH — 다른 키워드를 시도해 보세요</div>}
          {hits.map((h, i) => {
            const acc = h.category.accent;
            const isActive = i === active;
            const Icon = h.node.kind === "field" ? h.node.field!.icon : null;
            return (
              <button
                type="button"
                key={`${h.node.id}`}
                data-idx={i}
                role="option"
                aria-selected={isActive}
                data-accent={acc}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(h)}
                className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
              >
                {isActive && (
                  <motion.span
                    layoutId="palette-active"
                    className="absolute inset-0 rounded-xl border"
                    style={{ borderColor: `${acc}55`, background: `${acc}14` }}
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span
                  className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-xs font-bold"
                  style={h.node.kind === "tool" ? { background: acc, color: "#050505" } : { border: `1px solid ${acc}66`, color: acc }}
                >
                  {Icon ? <Icon className="h-4 w-4" strokeWidth={1.5} /> : monogram(h.node.label)}
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{h.node.label}</span>
                  <span className="block truncate text-xs text-white/45">
                    {h.node.kind === "tool" ? `${h.node.field!.name} · ${h.node.entry!.useCase}` : `분야 · ${h.node.children.length}개 툴`}
                  </span>
                </span>
                <span className="relative font-mono text-[9px] tracking-[0.18em]" style={{ color: h.category.slug === category.slug ? "rgba(255,255,255,0.35)" : acc }}>
                  {h.category.nameEn}
                </span>
                {isActive && <CornerDownLeft className="relative h-3.5 w-3.5 text-white/50" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5 font-mono text-[9px] tracking-[0.2em] text-white/30">
          <span>↑↓ 이동 · ↵ 이동하고 강조</span>
          <span>{hits.length} RESULTS</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
