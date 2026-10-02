"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import type { Category } from "@/data/archive";
import { countTools } from "@/data/archive";
import { Crosshairs } from "@/components/ui/Crosshairs";
import { CategoryVisual } from "./CategoryVisual";

export type CardSize = "hero" | "tall" | "wide";

export function CategoryCard({
  category,
  size,
  hovered,
  dimmed,
  onHover,
  onOpen,
  className = "",
  ready,
  order,
}: {
  category: Category;
  size: CardSize;
  hovered: boolean;
  dimmed: boolean;
  onHover: (slug: string | null) => void;
  onOpen: (category: Category, rect: DOMRect) => void;
  className?: string;
  ready: boolean;
  order: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const { accent } = category;
  const tools = countTools(category);

  // 3D tilt
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotX = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 220, damping: 20 });
  const rotY = useSpring(useTransform(px, [0, 1], [-9, 9]), { stiffness: 220, damping: 20 });

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    if (!reduce) {
      px.set(x);
      py.set(y);
    }
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    onHover(null);
  };

  const big = size === "hero";
  const wide = size === "wide";

  return (
    <motion.div
      className={`group/card relative ${className}`}
      style={{ perspective: 1200 }}
      custom={order}
      initial="hidden"
      animate={!ready ? "hidden" : dimmed ? "dim" : "show"}
      variants={{
        hidden: { opacity: 0, y: 70, scale: 0.94, filter: "saturate(1) blur(12px)" },
        show: (i: number) => ({
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "saturate(1) blur(0px)",
          transition: { type: "spring", stiffness: 110, damping: 19, delay: revealed ? 0 : 0.35 + i * 0.09 },
        }),
        dim: { opacity: 0.4, y: 0, scale: 0.985, filter: "saturate(0.3) blur(0px)", transition: { type: "spring", stiffness: 200, damping: 26 } },
      }}
      onAnimationComplete={(def) => def === "show" && setRevealed(true)}
    >
      <motion.button
        ref={ref}
        type="button"
        data-accent={accent}
        aria-label={`${category.name} ${category.nameEn} — ${tools}개 툴 보기`}
        onPointerMove={onMove}
        onPointerEnter={() => onHover(category.slug)}
        onPointerLeave={onLeave}
        onFocus={() => onHover(category.slug)}
        onBlur={() => onHover(null)}
        onClick={() => ref.current && onOpen(category, ref.current.getBoundingClientRect())}
        whileTap={{ scale: 0.985 }}
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d", ["--accent" as string]: accent }}
        className="relative block h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025] text-left outline-none backdrop-blur-xl transition-[border-color,box-shadow] duration-500 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {/* spotlight fill from cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            background: `radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), ${accent}2e, transparent 45%)`,
          }}
        />
        {/* border light from cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            padding: 1,
            background: `radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), ${accent}, transparent 60%)`,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        {/* inner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[28px] transition-shadow duration-500"
          style={{ boxShadow: hovered ? `inset 0 0 60px ${accent}22, 0 0 80px -20px ${accent}66` : "inset 0 0 0 transparent" }}
        />

        {/* visual */}
        <div
          aria-hidden
          className={`pointer-events-none absolute max-md:opacity-45 ${
            big
              ? "right-[-4%] top-[14%] h-[58%] w-[70%]"
              : wide
                ? "right-[3%] top-1/2 h-[46%] w-[52%] -translate-y-1/2 max-md:right-[-6%] max-md:top-[14%] max-md:h-[26%] max-md:w-[70%] max-md:translate-y-0"
                : "right-[4%] top-[20%] h-[42%] w-[40%]"
          }`}
          style={{ transform: "translateZ(40px)" }}
        >
          <CategoryVisual slug={category.slug} accent={accent} active={hovered} />
        </div>

        {/* content */}
        <div className="relative flex h-full flex-col justify-between p-6 md:p-8" style={{ transform: "translateZ(60px)" }}>
          <div className="flex items-start justify-between font-mono text-[11px] tracking-[0.18em] text-white/50">
            <div className="flex items-center gap-3">
              <span style={{ color: accent }}>[{category.index}]</span>
              <span>{"// "}{category.nameEn}</span>
            </div>
            <span
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-all duration-500 group-hover/card:rotate-45 group-hover/card:border-transparent group-hover/card:text-black"
              style={{ background: hovered ? accent : "transparent", boxShadow: hovered ? `0 0 24px ${accent}` : undefined }}
            >
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
            </span>
          </div>

          <div className={wide ? "max-w-[46%] max-md:max-w-none" : ""}>
            <div className={`mb-4 flex flex-wrap gap-1.5 ${size === "tall" ? "max-w-[62%]" : ""}`}>
              {category.fields.map((f) => (
                <span key={f.id} className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] tracking-wider text-white/55">
                  {f.nameEn}
                </span>
              ))}
            </div>
            <h2
              className={`font-sans font-extrabold leading-[0.92] tracking-[-0.04em] text-white ${
                big ? "text-6xl md:text-8xl" : "text-5xl md:text-6xl"
              }`}
            >
              {category.name}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/55">{category.tagline}</p>
            <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4 font-mono text-[11px] tracking-[0.2em]">
              <span className="text-white/40">{category.fields.length} FIELDS</span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-medium tracking-tight" style={{ color: accent, textShadow: `0 0 24px ${accent}88` }}>
                  {String(tools).padStart(2, "0")}
                </span>
                <span className="text-white/60">TOOLS</span>
              </span>
            </div>
          </div>
        </div>

        <Crosshairs color={hovered ? accent : "rgba(255,255,255,0.28)"} inset={12} />
      </motion.button>
    </motion.div>
  );
}
