"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ScrambleText } from "@/components/ui/ScrambleText";

const LOG = [
  "> init archive.core",
  "> mount /developer /designer /study /video",
  "> index tools ........ ok",
  "> render interface",
];

/** ~1.2s boot overlay. Calls onDone when it starts leaving so the UI can reveal underneath. */
export function BootSequence({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const total = reduce ? 200 : 1200;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      setPct(Math.round((1 - Math.pow(1 - t, 3)) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        onDone();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone, reduce]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-ink"
      initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
      animate={leaving ? { clipPath: "inset(0% 0% 100% 0%)" } : { clipPath: "inset(0% 0% 0% 0%)" }}
      transition={{ type: "spring", stiffness: 70, damping: 18 }}
      style={{ pointerEvents: leaving ? "none" : "auto" }}
    >
      <div className="grid-lines absolute inset-0 opacity-60" />

      <div className="relative">
        <ScrambleText
          text="AI ARCHIVE"
          duration={760}
          className="font-display text-5xl font-bold tracking-[-0.04em] text-white md:text-8xl"
        />
        {/* chromatic glitch copies */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 font-display text-5xl font-bold tracking-[-0.04em] mix-blend-screen md:text-8xl"
          style={{ color: "#00F0FF" }}
          animate={{ x: [0, -4, 3, 0, -2, 0], opacity: [0, 0.7, 0, 0.6, 0, 0] }}
          transition={{ duration: 0.9, times: [0, 0.2, 0.35, 0.6, 0.8, 1] }}
        >
          AI ARCHIVE
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 font-display text-5xl font-bold tracking-[-0.04em] mix-blend-screen md:text-8xl"
          style={{ color: "#FF2E88" }}
          animate={{ x: [0, 4, -3, 0, 2, 0], opacity: [0, 0.7, 0, 0.6, 0, 0] }}
          transition={{ duration: 0.9, times: [0, 0.25, 0.4, 0.65, 0.85, 1] }}
        >
          AI ARCHIVE
        </motion.div>
      </div>

      <div className="mt-8 w-[min(320px,70vw)] font-mono text-[10px] tracking-[0.2em] text-white/50">
        <div className="mb-2 flex justify-between">
          <span>BOOTING</span>
          <span className="tabular-nums text-white">{String(pct).padStart(3, "0")}%</span>
        </div>
        <div className="h-px w-full bg-white/10">
          <div
            className="h-px"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg,#00F0FF,#FF2E88,#C6FF00,#FF6B00)",
              boxShadow: "0 0 12px rgba(255,255,255,0.6)",
            }}
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-6 font-mono text-[10px] leading-5 text-white/35 md:left-10">
        {LOG.map((l, i) => (
          <motion.div key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 + i * 0.22, duration: 0.01 }}>
            {l}
          </motion.div>
        ))}
      </div>
      <div className="absolute bottom-8 right-6 font-mono text-[10px] text-white/35 md:right-10">v2026.09</div>
    </motion.div>
  );
}
