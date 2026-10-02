"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const DEFAULT_PALETTE = ["#00F0FF", "#FF2E88", "#C6FF00", "#FF6B00"];

/**
 * Fixed page backdrop: slow aurora glow + thin grid lines, with mouse-driven
 * parallax at different depths.
 */
export function Backdrop({ palette = DEFAULT_PALETTE, intensity = 1 }: { palette?: string[]; intensity?: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20 });
  const sy = useSpring(my, { stiffness: 40, damping: 20 });

  const farX = useTransform(sx, (v) => v * -18);
  const farY = useTransform(sy, (v) => v * -18);
  const nearX = useTransform(sx, (v) => v * 36);
  const nearY = useTransform(sy, (v) => v * 36);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my, reduce]);

  const [a, b, c, d] = [0, 1, 2, 3].map((i) => palette[i % palette.length]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <motion.div className="absolute inset-[-10%]" style={{ x: nearX, y: nearY, opacity: intensity }}>
        <div className="aurora-blob aurora-a" style={{ left: "-5%", top: "-10%", width: "46vw", height: "46vw", background: a, opacity: 0.22 }} />
        <div className="aurora-blob aurora-b" style={{ right: "-8%", top: "8%", width: "38vw", height: "38vw", background: b, opacity: 0.18 }} />
        <div className="aurora-blob aurora-c" style={{ left: "28%", bottom: "-18%", width: "42vw", height: "42vw", background: c, opacity: 0.12 }} />
        <div className="aurora-blob aurora-d" style={{ right: "18%", bottom: "-6%", width: "30vw", height: "30vw", background: d, opacity: 0.16 }} />
      </motion.div>
      <motion.div className="grid-lines absolute inset-[-40px]" style={{ x: farX, y: farY }} />
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.85) 100%)" }} />
    </div>
  );
}
