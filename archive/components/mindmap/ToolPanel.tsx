"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Copy, CornerDownLeft, X } from "lucide-react";
import { useRef, useState } from "react";
import { TOOLS, type Category, type Pricing } from "@/data/archive";
import { monogram, toolOccurrences, type GNode } from "@/lib/graph";
import { Crosshairs } from "@/components/ui/Crosshairs";

const PRICING_STYLE: Record<Pricing, { label: string; color: string }> = {
  Free: { label: "FREE", color: "#C6FF00" },
  Freemium: { label: "FREE + PAID", color: "#ffffff" },
  Paid: { label: "PAID", color: "#FF6B00" },
};

export function ToolPanel({
  node,
  category,
  mobile,
  onClose,
  onJump,
}: {
  node: GNode | null;
  category: Category;
  mobile: boolean;
  onClose: () => void;
  /** Jump to a tool node — in this map, or another category's map. */
  onJump: (nodeId: string, slug: string) => void;
}) {
  return (
    <AnimatePresence>
      {node && (
        <>
          {mobile && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}
          <motion.aside
            key="panel"
            role="dialog"
            aria-label={`${node.label} 상세`}
            data-accent={category.accent}
            initial={mobile ? { y: "100%" } : { x: "110%" }}
            animate={mobile ? { y: 0 } : { x: 0 }}
            exit={mobile ? { y: "100%" } : { x: "110%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            className={
              mobile
                ? "fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl thin-scroll"
                : "fixed bottom-4 right-4 top-[84px] z-40 w-[420px] overflow-y-auto rounded-[28px] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl thin-scroll"
            }
            style={{ boxShadow: `0 0 80px -30px ${category.accent}, inset 0 1px 0 rgba(255,255,255,0.06)` }}
          >
            <PanelBody node={node} category={category} onClose={onClose} onJump={onJump} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function CopyButton({ text, accent }: { text: string; accent: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={copy}
      data-accent={accent}
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors"
      style={copied ? { borderColor: accent, color: accent } : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

function PanelBody({ node, category, onClose, onJump }: { node: GNode; category: Category; onClose: () => void; onJump: (nodeId: string, slug: string) => void }) {
  const { accent } = category;
  const tool = node.tool!;
  const entry = node.entry!;
  const price = PRICING_STYLE[tool.pricing];
  const usedIn = toolOccurrences(entry.tool).filter((o) => o.nodeId !== node.id);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
  };

  return (
    <motion.div key={node.id} className="relative p-6 md:p-7" variants={stagger} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-white/45">
        <span>
          <span style={{ color: accent }}>[TOOL]</span> {"// "}{node.field!.nameEn}
        </span>
        <button type="button" onClick={onClose} aria-label="닫기" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-white/30 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </motion.div>

      <motion.div variants={item} className="mt-6 flex items-center gap-4">
        <span
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-2xl font-bold"
          style={{ background: `linear-gradient(145deg, ${accent}, ${accent}55 60%, #111)`, color: "#050505", boxShadow: `0 0 36px ${accent}55` }}
        >
          {monogram(tool.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate font-display text-4xl font-bold tracking-[-0.04em] text-white">{tool.name}</h2>
          <p className="mt-1 text-sm text-white/60">{entry.useCase}</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] tracking-wider">
        <span className="rounded-full border px-2.5 py-1" style={{ borderColor: `${accent}66`, color: accent, background: `${accent}12` }}>
          #{entry.tag}
        </span>
        <span className="rounded-full border px-2.5 py-1" style={{ borderColor: `${price.color}55`, color: price.color }}>
          {price.label}
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-white/50">{node.field!.name}</span>
      </motion.div>

      <motion.p variants={item} className="mt-6 text-[15px] leading-relaxed text-white/75">
        {tool.description}
      </motion.p>

      <motion.div
        variants={item}
        className="relative mt-6 overflow-hidden rounded-2xl border p-5"
        style={{ borderColor: `${accent}40`, background: `linear-gradient(135deg, ${accent}1a, transparent 70%)` }}
      >
        <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em]" style={{ color: accent }}>
          <CornerDownLeft className="h-3 w-3" /> 이 작업엔 이걸 써라
        </div>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-white">{entry.recommendation}</p>
      </motion.div>

      <motion.section variants={item} className="mt-8">
        <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-white/40">{"// "}왜 좋은가</h3>
        <ul className="space-y-2.5">
          {tool.strengths.map((s) => (
            <li key={s} className="flex gap-3 text-[14px] leading-relaxed text-white/80">
              <Check className="mt-1 h-3.5 w-3.5 shrink-0" style={{ color: accent }} strokeWidth={2.5} />
              {s}
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section variants={item} className="mt-8">
        <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-white/40">{"// "}이렇게 활용하세요</h3>
        <ol className="space-y-3">
          {tool.howTo.map((step, i) => (
            <li key={step} className="flex gap-3 text-[14px] leading-relaxed text-white/80">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[10px]"
                style={{ borderColor: `${accent}55`, color: accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </motion.section>

      {entry.prompt && (
        <motion.section variants={item} className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-[10px] tracking-[0.2em] text-white/40">{"// "}예시 프롬프트</h3>
            <CopyButton text={entry.prompt} accent={accent} />
          </div>
          <pre
            className="whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-[12.5px] leading-relaxed text-white/85"
            style={{ boxShadow: `inset 0 0 24px ${accent}10` }}
          >
            {entry.prompt}
          </pre>
          {entry.prompt.includes("[") && <p className="mt-2 text-[11px] text-white/35">[대괄호] 부분은 내 상황에 맞게 바꿔서 쓰세요.</p>}
        </motion.section>
      )}

      <motion.a
        variants={item}
        href={tool.url}
        target="_blank"
        rel="noreferrer"
        data-accent={accent}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group mt-6 flex items-center justify-between rounded-2xl px-5 py-4 font-semibold text-black"
        style={{ background: accent, boxShadow: `0 0 40px -6px ${accent}` }}
      >
        <span>공식 사이트 방문</span>
        <span className="flex items-center gap-2 font-mono text-[11px] font-medium opacity-70">
          {new URL(tool.url).hostname.replace("www.", "")}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </motion.a>

      {tool.related.length > 0 && (
        <motion.section variants={item} className="mt-8">
          <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-white/40">{"// "}관련 툴</h3>
          <div className="grid grid-cols-1 gap-2">
            {tool.related.map((key) => {
              const r = TOOLS[key];
              const occ = toolOccurrences(key);
              const here = occ.find((o) => o.category.slug === category.slug) ?? occ[0];
              const racc = here?.category.accent ?? accent;
              return (
                <button
                  type="button"
                  key={key}
                  data-accent={racc}
                  disabled={!here}
                  onClick={() => here && onJump(here.nodeId, here.category.slug)}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.05]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold text-black" style={{ background: racc }}>
                    {monogram(r.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{r.name}</span>
                    <span className="block truncate font-mono text-[10px] tracking-wider text-white/40">
                      {here ? `${here.category.name} › ${here.field.name}` : "—"}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-white" />
                </button>
              );
            })}
          </div>
        </motion.section>
      )}

      {usedIn.length > 0 && (
        <motion.section variants={item} className="mt-8">
          <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-white/40">{"// "}다른 곳에서도 쓰여요</h3>
          <div className="flex flex-wrap gap-2">
            {usedIn.map((o) => (
              <button
                type="button"
                key={o.nodeId}
                data-accent={o.category.accent}
                onClick={() => onJump(o.nodeId, o.category.slug)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition-colors hover:text-white"
                style={{ borderColor: `${o.category.accent}44` }}
              >
                <span style={{ color: o.category.accent }}>●</span> {o.category.name} › {o.field.name}
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <div className="mt-8 border-t border-white/10 pt-4 font-mono text-[9px] tracking-[0.2em] text-white/25">NODE_ID: {node.id}</div>
      <Crosshairs inset={10} color={`${accent}66`} />
    </motion.div>
  );
}
