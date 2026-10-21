"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Backdrop } from "@/components/ui/Backdrop";
import { Crosshairs } from "@/components/ui/Crosshairs";
import { ScrambleText } from "@/components/ui/ScrambleText";

const PRIZE = process.env.NEXT_PUBLIC_KIOSK_PRIZE ?? "스타벅스 아메리카노";

type Dest = {
  key: "news" | "archive";
  href: string;
  accent: string;
  label: string;
  en: string;
  desc: string;
};

const DESTS: Dest[] = [
  { key: "news", href: "/news/index.html", accent: "#00F0FF", label: "AI 소식", en: "NEWS · MODELS · PRICE", desc: "최신 모델 · 요금 비교 · 진화 타임라인" },
  { key: "archive", href: "/", accent: "#FF2E88", label: "작업별 AI\n기능 추천", en: "ARCHIVE · BY TASK", desc: "개발 · 디자인 · 공부 · 영상 편집" },
];

export function KioskStart() {
  const reduce = useReducedMotion();
  const [going, setGoing] = useState<{ dest: Dest; rect: DOMRect } | null>(null);

  useEffect(() => {
    // 이 기기를 키오스크로 표시 → 이후 모든 페이지에서 설문 버튼·이용 기록·2분 복귀가 켜져요
    try {
      localStorage.setItem("kiosk.on", "true");
    } catch {
      /* 저장 불가 환경 */
    }
  }, []);

  const go = (dest: Dest, el: HTMLElement) => {
    if (going) return;
    window.KIOSK?.startSession(dest.key);
    if (reduce) return window.location.assign(dest.href);
    setGoing({ dest, rect: el.getBoundingClientRect() });
  };

  return (
    <main className="relative flex h-dvh w-full flex-col overflow-hidden px-[4vw] py-[3.2vh] text-white">
      <Backdrop intensity={1.3} />
      <Orb />

      {/* 상단 */}
      <header className="relative z-10 flex items-center justify-between font-mono text-[clamp(10px,1.6vh,13px)] tracking-[0.22em] text-white/55">
        <div className="flex items-center gap-3 text-white">
          <span className="relative grid h-6 w-6 place-items-center">
            <span className="absolute inset-0 rotate-45 border border-white/70" />
            <span className="h-1.5 w-1.5 bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
          </span>
          AI_KIOSK
        </div>
        <Clock />
      </header>

      {/* 타이틀 */}
      <section className="relative z-10 mt-[3vh] text-center">
        <motion.div
          className="font-mono text-[clamp(10px,1.7vh,13px)] tracking-[0.4em] text-[#00F0FF]"
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          [ TOUCH TO START ]
        </motion.div>
        <h1 className="mt-[1.4vh] text-[clamp(30px,8.4vh,84px)] font-extrabold leading-[1.02] tracking-[-0.045em]">
          <ScrambleText text="지금 AI, 무엇이 새롭고" duration={900} className="block" />
          <span className="block bg-gradient-to-r from-[#00F0FF] via-white to-[#FF2E88] bg-clip-text text-transparent">
            나에겐 무엇이 맞을까?
          </span>
        </h1>
      </section>

      {/* 큰 버튼 2개 */}
      <section className="relative z-10 mt-[3.6vh] grid flex-1 grid-cols-2 gap-[2.4vw]">
        {DESTS.map((d, i) => (
          <motion.button
            key={d.key}
            type="button"
            data-track={`시작: ${d.label.replace("\n", " ")}`}
            onClick={(e) => go(d, e.currentTarget)}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.25 + i * 0.12 }}
            whileTap={{ scale: 0.96 }}
            className="group relative flex min-h-0 flex-col justify-between overflow-hidden rounded-[clamp(18px,3.4vh,32px)] border p-[clamp(14px,3vh,30px)] text-left backdrop-blur-xl"
            style={{
              borderColor: `${d.accent}66`,
              background: `radial-gradient(120% 120% at ${i ? "100% 0%" : "0% 0%"}, ${d.accent}26, transparent 55%), rgba(10,10,12,0.55)`,
              boxShadow: `0 0 60px -18px ${d.accent}, inset 0 0 40px ${d.accent}12`,
            }}
          >
            <Sweep color={d.accent} delay={i * 1.6} />
            <CardVisual kind={d.key} accent={d.accent} />
            <div className="relative flex items-start justify-between">
              <span className="font-mono text-[clamp(10px,1.6vh,13px)] tracking-[0.22em]" style={{ color: d.accent }}>
                [0{i + 1}] {d.en}
              </span>
              <motion.span
                className="grid h-[clamp(36px,7vh,56px)] w-[clamp(36px,7vh,56px)] place-items-center rounded-full text-black"
                style={{ background: d.accent, boxShadow: `0 0 26px ${d.accent}` }}
                animate={{ rotate: [0, 8, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
              >
                <ArrowUpRight className="h-1/2 w-1/2" strokeWidth={2.4} />
              </motion.span>
            </div>
            <div className="relative">
              <div className="whitespace-pre-line text-[clamp(26px,7vh,64px)] font-extrabold leading-[1.02] tracking-[-0.045em]">{d.label}</div>
              <div className="mt-[1vh] text-[clamp(12px,2.2vh,18px)] text-white/65">{d.desc}</div>
            </div>
            <Crosshairs color={`${d.accent}aa`} inset={10} />
          </motion.button>
        ))}
      </section>

      {/* 추첨 배너 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 mx-auto mt-[2.4vh] flex items-center gap-3 overflow-hidden rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-5 py-[0.9vh] text-[clamp(12px,2.2vh,17px)] font-semibold"
      >
        <span className="text-[1.3em]">☕</span>
        <span>
          둘러보고 <b className="text-[#ffb37a]">1분 설문</b>에 참여하면 추첨을 통해 <b className="text-[#ffb37a]">{PRIZE}</b>를 드려요
        </span>
        <motion.i
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          animate={{ left: ["-40%", "140%"] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2 }}
        />
      </motion.div>

      <AnimatePresence>{going && <Expand {...going} onDone={() => window.location.assign(going.dest.href)} />}</AnimatePresence>
    </main>
  );
}

/* 가운데 뒤에서 천천히 도는 빛 고리 */
function Orb() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
      <motion.div
        className="h-[78vh] w-[78vh] rounded-full opacity-60"
        style={{ background: "conic-gradient(from 0deg, transparent, #00F0FF55, transparent 30%, #FF2E8855, transparent 65%, #C6FF0033, transparent)", filter: "blur(28px)" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[14%] rounded-full border border-white/10"
        animate={{ rotate: -360, scale: [1, 1.04, 1] }}
        transition={{ rotate: { duration: 40, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity } }}
        style={{ borderTopColor: "#00F0FF88", borderRightColor: "transparent", borderBottomColor: "#FF2E8888" }}
      />
    </div>
  );
}

/* 카드 위를 지나가는 빛줄기 */
function Sweep({ color, delay }: { color: string; delay: number }) {
  return (
    <motion.i
      aria-hidden
      className="pointer-events-none absolute -inset-y-10 w-1/4 -skew-x-12"
      style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }}
      animate={{ left: ["-40%", "140%"] }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.6, delay }}
    />
  );
}

/* 카드별 장식: 소식 = 레이더 파동, 추천 = 연결된 노드 */
function CardVisual({ kind, accent }: { kind: Dest["key"]; accent: string }) {
  if (kind === "news") {
    return (
      <div aria-hidden className="pointer-events-none absolute -right-[8%] top-1/2 h-[90%] -translate-y-1/2 opacity-70" style={{ aspectRatio: "1" }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: accent }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, delay: i, ease: "easeOut" }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: accent, boxShadow: `0 0 20px ${accent}` }} />
      </div>
    );
  }
  const nodes = [
    [50, 50], [18, 22], [82, 20], [16, 80], [84, 78], [50, 12],
  ];
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute -right-[4%] top-1/2 h-[86%] -translate-y-1/2 opacity-75">
      {nodes.slice(1).map(([x, y], i) => (
        <motion.line
          key={i}
          x1={50} y1={50} x2={x} y2={y}
          stroke={accent} strokeWidth={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.2, 0.9, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.25 }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x} cy={y} r={i === 0 ? 5 : 3}
          fill={i === 0 ? accent : "#0a0a0c"} stroke={accent} strokeWidth={1}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          style={{ transformOrigin: `${x}px ${y}px`, filter: `drop-shadow(0 0 3px ${accent})` }}
        />
      ))}
    </svg>
  );
}

/* 누른 카드가 화면 가득 커지며 넘어가는 전환 */
function Expand({ dest, rect, onDone }: { dest: Dest; rect: DOMRect; onDone: () => void }) {
  return (
    <motion.div
      className="fixed z-[80] overflow-hidden border"
      style={{ borderColor: dest.accent }}
      initial={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 28, backgroundColor: "rgba(10,10,12,0.7)" }}
      animate={{ top: 0, left: 0, width: "100vw", height: "100dvh", borderRadius: 0, backgroundColor: "rgba(5,5,5,1)" }}
      transition={{ type: "spring", stiffness: 95, damping: 17 }}
      onAnimationComplete={onDone}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.3, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1.4 }}
        transition={{ duration: 0.9 }}
        style={{ background: `radial-gradient(circle at 50% 50%, ${dest.accent}55, transparent 60%)` }}
      />
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-[clamp(11px,2vh,14px)] tracking-[0.3em]" style={{ color: dest.accent }}>{dest.en}</div>
          <div className="mt-3 whitespace-pre-line text-[clamp(34px,10vh,96px)] font-extrabold leading-none tracking-[-0.045em]">{dest.label}</div>
          <div className="mx-auto mt-5 h-[2px] w-[30vw] overflow-hidden bg-white/10">
            <motion.div className="h-full" style={{ background: dest.accent, boxShadow: `0 0 12px ${dest.accent}` }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.7 }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const fmt = () =>
      setT(new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    const raf = requestAnimationFrame(fmt);
    const id = setInterval(fmt, 10_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  return <span className="tabular-nums">{t}</span>;
}
