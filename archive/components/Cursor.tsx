"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useKiosk } from "@/lib/useKiosk";

const HOVERABLE = "a, button, [role='button'], input, [data-cursor]";

const FINE = "(pointer: fine)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(FINE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Small dot that follows the pointer exactly + a ring that trails with spring
 * physics. The ring grows and glows (in the hovered element's accent) on
 * interactive elements.
 */
export function Cursor() {
  const enabled = useSyncExternalStore(subscribe, () => window.matchMedia(FINE).matches, () => false);
  const kiosk = useKiosk();
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 520, damping: 38, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 520, damping: 38, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const el = (e.target as Element | null)?.closest?.(HOVERABLE) as HTMLElement | null;
      setHover(!!el);
      const accentEl = (e.target as Element | null)?.closest?.("[data-accent]") as HTMLElement | null;
      setColor(accentEl?.dataset.accent ?? "#ffffff");
    };
    const leave = () => setVisible(false);
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, x, y]);

  if (!enabled || kiosk) return null; // 키오스크는 터치 전용

  const size = hover ? 46 : 22;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]" style={{ opacity: visible ? 1 : 0 }}>
      <motion.div
        className="absolute left-0 top-0 rounded-full border"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: down ? size * 0.8 : size,
          height: down ? size * 0.8 : size,
          borderColor: hover ? color : "rgba(255,255,255,0.5)",
          backgroundColor: hover ? `${color}1f` : "rgba(255,255,255,0)",
          boxShadow: hover ? `0 0 24px ${color}88, inset 0 0 12px ${color}55` : "0 0 0px rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      />
      <motion.div
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full"
        style={{ x, y, translateX: "-50%", translateY: "-50%", backgroundColor: hover ? color : "#fff" }}
      />
    </div>
  );
}
