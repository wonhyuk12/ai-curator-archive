"use client";

import { motion } from "framer-motion";

/** Abstract, 3D-ish visual per category. Pure CSS/SVG so it stays crisp at any size. */
export function CategoryVisual({ slug, accent, active }: { slug: string; accent: string; active: boolean }) {
  switch (slug) {
    case "developer":
      return <Cube accent={accent} active={active} />;
    case "designer":
      return <Torus accent={accent} active={active} />;
    case "study":
      return <Stack accent={accent} active={active} />;
    default:
      return <Waveform accent={accent} active={active} />;
  }
}

/* Developer — nested wireframe cubes rotating in real CSS 3D */
function Cube({ accent, active }: { accent: string; active: boolean }) {
  const faces = [
    "rotateY(0deg)",
    "rotateY(90deg)",
    "rotateY(180deg)",
    "rotateY(-90deg)",
    "rotateX(90deg)",
    "rotateX(-90deg)",
  ];
  const cube = (size: number, dir: 1 | -1, dur: number, alpha: string) => (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, transformStyle: "preserve-3d" }}
      initial={{ rotateX: -24, rotateY: 0 }}
      animate={{ rotateY: 360 * dir, rotateX: -24 }}
      transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
    >
      {faces.map((f) => (
        <div
          key={f}
          className="absolute inset-0 border"
          style={{
            transform: `${f} translateZ(${size / 2}px)`,
            borderColor: accent,
            background: `linear-gradient(135deg, ${accent}${alpha}, transparent 70%)`,
            boxShadow: `inset 0 0 ${size / 5}px ${accent}33`,
          }}
        />
      ))}
    </motion.div>
  );
  return (
    <div className="relative h-full w-full" style={{ perspective: 900 }}>
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{ transformStyle: "preserve-3d", transform: active ? "scale(1.12)" : "scale(1)" }}
      >
        {cube(140, 1, 22, "22")}
        {cube(68, -1, 14, "40")}
      </div>
      <div
        className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: accent, filter: "blur(22px)", opacity: active ? 0.9 : 0.5 }}
      />
    </div>
  );
}

/* Designer — torus made of rotated ellipses + orbiting anchor point */
function Torus({ accent, active }: { accent: string; active: boolean }) {
  return (
    <motion.svg
      viewBox="-120 -120 240 240"
      className="h-full w-full overflow-visible"
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
      <defs>
        <radialGradient id="torus-core">
          <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="46" fill="url(#torus-core)" opacity={active ? 0.8 : 0.45} />
      {Array.from({ length: 18 }).map((_, i) => (
        <ellipse
          key={i}
          rx="92"
          ry="34"
          fill="none"
          stroke={accent}
          strokeOpacity={0.18 + (i % 3) * 0.12}
          strokeWidth="0.8"
          transform={`rotate(${i * 10})`}
        />
      ))}
      {/* bezier pen path with handles */}
      <path d="M-70 40 C -30 -60, 30 80, 70 -30" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.2" />
      <line x1="-70" y1="40" x2="-30" y2="-60" stroke="#fff" strokeOpacity="0.35" strokeDasharray="2 3" />
      <line x1="70" y1="-30" x2="30" y2="80" stroke="#fff" strokeOpacity="0.35" strokeDasharray="2 3" />
      {[
        [-70, 40],
        [70, -30],
      ].map(([x, y]) => (
        <rect key={x} x={x - 4} y={y - 4} width="8" height="8" fill="#050505" stroke={accent} strokeWidth="1.4" />
      ))}
      {[
        [-30, -60],
        [30, 80],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3" fill={accent} />
      ))}
    </motion.svg>
  );
}

/* Study — floating isometric layers, like pages of knowledge stacking up */
function Stack({ accent, active }: { accent: string; active: boolean }) {
  const layers = 6;
  return (
    <div className="relative h-full w-full" style={{ perspective: 800 }}>
      <div
        className="absolute left-1/2 top-1/2 transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) rotateX(58deg) rotateZ(${active ? 60 : 45}deg) scale(${active ? 1.1 : 1})`,
        }}
      >
        {Array.from({ length: layers }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute border"
            style={{
              width: 120,
              height: 120,
              left: -60,
              top: -60,
              borderColor: accent,
              background: i === layers - 1 ? `${accent}30` : `${accent}0d`,
              boxShadow: i === layers - 1 ? `0 0 40px ${accent}55` : undefined,
            }}
            animate={{ z: [i * 14, i * 26, i * 14] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          >
            {i === layers - 1 && (
              <div className="absolute inset-4 grid grid-cols-4 gap-2 opacity-70">
                {Array.from({ length: 16 }).map((_, j) => (
                  <div key={j} className="border" style={{ borderColor: `${accent}66` }} />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* Video — equalizer waveform + scanning playhead */
function Waveform({ accent, active }: { accent: string; active: boolean }) {
  const bars = 48;
  return (
    <div
      className="relative flex h-full w-full items-center gap-[3px] px-2 transition-[filter] duration-500"
      style={{ filter: active ? `drop-shadow(0 0 10px ${accent})` : "none" }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const base = 0.25 + 0.55 * Math.abs(Math.sin(i * 0.55) * Math.cos(i * 0.17));
        // 소수점을 줄여 서버/브라우저가 같은 값을 그리게 함 (하이드레이션 불일치 방지)
        const pct = (v: number) => `${v.toFixed(1)}%`;
        return (
          <motion.div
            key={i}
            className="flex-1 rounded-full"
            style={{ background: `linear-gradient(to top, ${accent}22, ${accent})`, originY: 0.5 }}
            initial={{ height: pct(base * 100) }}
            animate={{ height: [pct(base * 100), pct(Math.min(1, base * 1.6) * 100), pct(base * 60), pct(base * 100)] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: (i % 12) * 0.07 }}
          />
        );
      })}
      <motion.div
        className="absolute inset-y-0 w-px"
        style={{ background: "#fff", boxShadow: `0 0 16px 2px ${accent}` }}
        animate={{ left: ["2%", "98%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute -left-[5px] -top-1 h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent" style={{ borderTopColor: "#fff" }} />
      </motion.div>
    </div>
  );
}
