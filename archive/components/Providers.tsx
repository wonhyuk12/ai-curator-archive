"use client";

import { MotionConfig } from "framer-motion";
import { Cursor } from "./Cursor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 30 }}>
      {children}
      <Cursor />
      <div className="grain" aria-hidden />
    </MotionConfig>
  );
}
