"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}—=+*^?#01アイウエオカキ░▒▓█";

/**
 * Decodes `text` from random glyphs, left to right, over `duration` ms.
 */
export function ScrambleText({
  text,
  duration = 900,
  delay = 0,
  className,
  play = true,
}: {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  play?: boolean;
}) {
  const reduce = useReducedMotion();
  // Same initial output on server and client to keep hydration stable.
  const [out, setOut] = useState(() => (play ? text.replace(/\S/g, " ") : text));

  useEffect(() => {
    if (!play || reduce) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.max(0, now - start - delay) / duration;
      const revealed = Math.floor(t * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " " || i < revealed) s += ch;
        else if (now - start < delay) s += " ";
        else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay, reduce, play]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{reduce && play ? text : out}</span>
    </span>
  );
}
