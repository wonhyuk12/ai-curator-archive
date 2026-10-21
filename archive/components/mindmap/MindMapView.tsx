"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronsDownUp, ChevronsUpDown, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { countTools, getCategory } from "@/data/archive";
import { ancestors, buildGraph } from "@/lib/graph";
import { Backdrop } from "@/components/ui/Backdrop";
import { CommandPalette } from "./CommandPalette";
import { FlowCanvas, type ViewRequest } from "./FlowCanvas";
import { domId, MobileTree } from "./MobileTree";
import { ToolPanel } from "./ToolPanel";
import { useKiosk } from "@/lib/useKiosk";

type ViewRequestInput = ViewRequest extends infer V ? (V extends ViewRequest ? Omit<V, "nonce"> : never) : never;

const MOBILE_QUERY = "(max-width: 767px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
/** null during SSR / first hydration pass, then the real value. */
function useIsMobile(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => null);
}

export function MindMapView({ slug }: { slug: string }) {
  const router = useRouter();
  const category = getCategory(slug)!;
  const { accent } = category;
  const graph = useMemo(() => buildGraph(category), [category]);
  const kiosk = useKiosk();
  const narrow = useIsMobile();
  // 키오스크는 화면 크기와 상관없이 항상 마인드맵 (좁은 세로 화면이어도 목록으로 바꾸지 않아요)
  const isMobile = narrow === null ? null : narrow && !kiosk;

  const [expanded, setExpanded] = useState(() => new Set([slug]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [view, setView] = useState<ViewRequest>({ kind: "fit", nonce: 0 });
  const nonce = useRef(0);
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const request = useCallback((v: ViewRequestInput) => {
    setView({ ...v, nonce: ++nonce.current } as ViewRequest);
  }, []);

  const allExpandable = useMemo(() => [...graph.values()].filter((n) => n.kind !== "tool").map((n) => n.id), [graph]);
  const allOpen = allExpandable.every((id) => expanded.has(id));

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(expanded);
      if (next.has(id)) {
        const stack = [id];
        while (stack.length) {
          const x = stack.pop()!;
          next.delete(x);
          stack.push(...graph.get(x)!.children);
        }
        if (selectedId && ancestors(graph, selectedId).includes(id)) setSelectedId(null);
      } else {
        next.add(id);
        const node = graph.get(id)!;
        request(node.kind === "root" ? { kind: "fit" } : { kind: "nodes", ids: [id, ...node.children] });
      }
      setExpanded(next);
    },
    [expanded, graph, selectedId, request],
  );

  const expandAll = () => {
    setExpanded(new Set(allExpandable));
    request({ kind: "fit" });
  };
  const collapseAll = () => {
    setExpanded(new Set([slug]));
    setSelectedId(null);
    request({ kind: "fit" });
  };

  const selectTool = useCallback((id: string) => setSelectedId((cur) => (cur === id ? null : id)), []);

  /** Expand the path to a node, highlight it and bring it into view. */
  const focusNode = useCallback(
    (nodeId: string, targetSlug: string) => {
      if (targetSlug !== slug) {
        router.push(`/${targetSlug}?focus=${encodeURIComponent(nodeId)}`);
        return;
      }
      const node = graph.get(nodeId);
      if (!node) return;
      setExpanded((prev) => {
        const next = new Set(prev);
        ancestors(graph, nodeId).forEach((a) => next.add(a));
        return next;
      });
      if (node.kind === "tool") setSelectedId(nodeId);
      setHighlightId(null);
      requestAnimationFrame(() => setHighlightId(nodeId));
      clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightId(null), 3600);
      request({ kind: "center", id: nodeId });
      if (isMobile) setTimeout(() => document.getElementById(domId(nodeId))?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
    },
    [slug, graph, router, request, isMobile],
  );

  // ?focus=<nodeId> deep link (used when jumping between categories)
  useEffect(() => {
    if (isMobile === null) return;
    const f = new URLSearchParams(window.location.search).get("focus");
    if (!f) return;
    const t = setTimeout(() => focusNode(f, slug), 650);
    window.history.replaceState(null, "", `/${slug}`);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile === null]);

  // Keyboard: ⌘K / Ctrl+K / "/" → palette, Esc → close panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === "INPUT";
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === "Escape" && !typing) {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selected = selectedId ? graph.get(selectedId) ?? null : null;
  const tools = countTools(category);

  return (
    <main className="relative h-dvh w-full overflow-hidden" style={{ ["--accent" as string]: accent }}>
      <Backdrop palette={[accent, "#050505", accent, "#1a1a1a"]} intensity={0.55} />

      {/* ── Top bar ─────────────────────────────────────── */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.35 }}
        className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center gap-3 border-b border-white/10 bg-[#050505]/60 px-3 backdrop-blur-xl md:gap-4 md:px-5"
      >
        <Link
          href="/"
          aria-label="아카이브로 돌아가기"
          data-accent={accent}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <nav aria-label="breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-white/40">
          <Link href="/" className="hidden shrink-0 hover:text-white md:inline">
            AI_ARCHIVE
          </Link>
          <span className="hidden md:inline">/</span>
          <span className="flex shrink-0 items-center gap-2 text-white">
            <span style={{ color: accent }}>[{category.index}]</span>
            <span className="font-sans text-sm font-bold tracking-normal">{category.name}</span>
          </span>
          <AnimatePresence mode="popLayout">
            {selected && (
              <motion.span
                key={selected.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="hidden min-w-0 items-center gap-2 truncate md:flex"
              >
                <span>/</span>
                <span className="truncate">{selected.field!.name}</span>
                <span>/</span>
                <span className="truncate" style={{ color: accent }}>
                  {selected.label}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </nav>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          data-accent={accent}
          className="flex h-10 items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-3 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white md:w-72"
        >
          <Search className="h-4 w-4" />
          <span className="hidden flex-1 text-left md:inline">노드 검색…</span>
          <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] md:inline">⌘K</kbd>
        </button>

        <div className="flex shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.03]">
          <button
            type="button"
            onClick={expandAll}
            data-accent={accent}
            aria-label="모두 펼치기"
            className="flex h-10 items-center gap-2 px-3 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white md:px-4"
            style={allOpen ? { color: accent } : undefined}
          >
            <ChevronsUpDown className="h-4 w-4" />
            <span className="hidden lg:inline">모두 펼치기</span>
          </button>
          <button
            type="button"
            onClick={collapseAll}
            data-accent={accent}
            aria-label="모두 접기"
            className="flex h-10 items-center gap-2 border-l border-white/10 px-3 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white md:px-4"
          >
            <ChevronsDownUp className="h-4 w-4" />
            <span className="hidden lg:inline">모두 접기</span>
          </button>
        </div>
      </motion.header>

      {/* ── Canvas / Tree ───────────────────────────────── */}
      {isMobile === false && (
        <div className="absolute inset-0 pt-[68px]">
          <ReactFlowProvider>
            <FlowCanvas
              category={category}
              graph={graph}
              expanded={expanded}
              selectedId={selectedId}
              highlightId={highlightId}
              view={view}
              rightInset={selectedId ? 440 : 0}
              onToggle={toggle}
              onSelectTool={selectTool}
              onPaneClick={() => setSelectedId(null)}
            />
          </ReactFlowProvider>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pointer-events-none absolute left-5 top-[88px] font-mono max-[640px]:hidden text-[10px] leading-5 tracking-[0.18em] text-white/40"
          >
            <div className="text-white/70">
              {"// "}{category.nameEn} <span style={{ color: accent }}>MIND MAP</span>
            </div>
            <div>
              {category.fields.length} FIELDS · {tools} TOOLS
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-full" style={{ background: accent }} /> L1 CATEGORY
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm border" style={{ borderColor: accent }} /> L2 FIELD
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm border border-white/40" /> L3 TOOL
              </div>
            </div>
            <div className="mt-3 text-white/30">CLICK NODE TO EXPAND</div>
          </motion.div>
        </div>
      )}
      {isMobile === true && (
        <div className="thin-scroll absolute inset-0 overflow-y-auto pt-[68px]">
          <div className="px-4 pt-5 font-mono text-[10px] tracking-[0.18em] text-white/40">
            {"// "}{category.nameEn} <span style={{ color: accent }}>TREE</span> · {tools} TOOLS
          </div>
          <MobileTree
            category={category}
            graph={graph}
            expanded={expanded}
            selectedId={selectedId}
            highlightId={highlightId}
            onToggle={toggle}
            onSelectTool={selectTool}
          />
        </div>
      )}

      <ToolPanel node={selected} category={category} mobile={!!isMobile} onClose={() => setSelectedId(null)} onJump={focusNode} />
      <CommandPalette open={paletteOpen} category={category} onClose={() => setPaletteOpen(false)} onPick={focusNode} />

      {/* Entry veil — matches the landing card's expanded state, then dissolves */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] bg-ink"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 50%, ${accent}40, transparent 55%)` }} />
        <motion.div
          className="absolute left-[8vw] top-1/2 -translate-y-1/2"
          initial={{ scale: 1, filter: "blur(0px)" }}
          animate={{ scale: 1.08, filter: "blur(8px)" }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="font-mono text-[11px] tracking-[0.2em]" style={{ color: accent }}>
            [{category.index}] {"// "}{category.nameEn}
          </div>
          <div className="mt-3 text-6xl font-extrabold tracking-[-0.04em] text-white md:text-8xl">{category.name}</div>
          <div className="mt-4 h-px w-40" style={{ background: accent }} />
        </motion.div>
      </motion.div>
    </main>
  );
}
