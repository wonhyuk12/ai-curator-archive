"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ALL_TOOL_NAMES, ARCHIVE, ARCHIVE_CHECKED, type Category } from "@/data/archive";
import { Backdrop } from "@/components/ui/Backdrop";
import { useKiosk } from "@/lib/useKiosk";
import { KioskExit } from "@/components/kiosk/KioskExit";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { BootSequence } from "./BootSequence";
import { CategoryCard } from "./CategoryCard";

// AI 큐레이터 주소: 환경 변수(NEXT_PUBLIC_CURATOR_URL)가 있으면 그 값, 없으면 배포 주소.
// 내 컴퓨터(localhost)에서 열었으면 브라우저에서 로컬 큐레이터(localhost:3001)로 바꿔 줌.
const CURATOR_URL = process.env.NEXT_PUBLIC_CURATOR_URL ?? "https://ai-curator-ten.vercel.app/";
function useCuratorUrl() {
  const [url, setUrl] = useState(CURATOR_URL);
  const kiosk = useKiosk(); // 키오스크: 같은 주소(/news)의 큐레이터로
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_CURATOR_URL && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
      setUrl("http://localhost:3001/"); // eslint-disable-line react-hooks/set-state-in-effect -- 브라우저에서만 알 수 있는 값
    }
  }, []);
  return kiosk ? "/news/index.html" : url;
}

// Boot plays once per full page load; client-side navigation back to "/" skips it.
let hasBooted = false;

type Expanding = { category: Category; rect: DOMRect } | null;

export function Landing() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [booting, setBooting] = useState(!hasBooted);
  const [ready, setReady] = useState(hasBooted);
  const [hovered, setHovered] = useState<string | null>(null);
  const [expanding, setExpanding] = useState<Expanding>(null);
  const curatorUrl = useCuratorUrl();
  const kiosk = useKiosk();

  const onBootDone = useCallback(() => {
    hasBooted = true;
    setReady(true);
    setTimeout(() => setBooting(false), 1400);
  }, []);

  useEffect(() => {
    ARCHIVE.forEach((c) => router.prefetch(`/${c.slug}`));
  }, [router]);

  const open = (category: Category, rect: DOMRect) => {
    if (expanding) return;
    if (reduce) return router.push(`/${category.slug}`);
    setExpanding({ category, rect });
  };

  const totalTools = ARCHIVE.reduce((n, c) => n + c.fields.reduce((m, f) => m + f.tools.length, 0), 0);

  const rise = {
    hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
  };

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Backdrop />
      {booting && <BootSequence onDone={onBootDone} />}

      <motion.div
        className="relative mx-auto max-w-[1440px] px-4 pb-10 md:px-10"
        initial="hidden"
        animate={ready ? "show" : "hidden"}
        variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      >
        {/* ── Top bar ─────────────────────────────────── */}
        <motion.header variants={rise} className="flex items-center justify-between border-b border-white/10 py-5 font-mono text-[10px] tracking-[0.2em] text-white/50 md:text-[11px]">
          <div className="flex items-center gap-3 text-white">
            <span className="relative grid h-6 w-6 place-items-center">
              <span className="absolute inset-0 rotate-45 border border-white/60" />
              <span className="h-1.5 w-1.5 bg-white" />
            </span>
            AI_ARCHIVE
          </div>
          <div className="hidden md:block">{"// "}INDEX OF AGENTS &amp; TOOLS</div>
          <div className="flex items-center gap-4">
            <a href={curatorUrl} className="flex items-center gap-2 text-white/70 transition-colors hover:text-[#00F0FF]">
              ← AI 큐레이터
            </a>
            {kiosk && <KioskExit />}
          </div>
        </motion.header>

        {/* ── Hero ────────────────────────────────────── */}
        <section className="relative pb-12 pt-14 md:pb-16 md:pt-20">
          <motion.div variants={rise} className="mb-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] text-white/45">
            <span className="text-white">[00]</span>
            <span className="h-px w-10 bg-white/30" />
            <span>CURATED ARCHIVE — v2026</span>
          </motion.div>

          <motion.h1
            variants={rise}
            className="relative select-none -ml-[0.04em] whitespace-nowrap font-display text-[19.5vw] font-bold leading-[0.8] tracking-[-0.065em] text-white md:text-[19.8vw] 2xl:text-[300px]"
          >
            <ScrambleText text="AI ARCHIVE" play={ready} duration={700} delay={hasBooted ? 0 : 150} />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.0) 40%, rgba(0,240,255,0.5) 50%, rgba(255,46,136,0.45) 58%, transparent 70%)",
                backgroundSize: "250% 100%",
                WebkitBackgroundClip: "text",
                animation: reduce ? undefined : "hero-sheen 6s ease-in-out infinite",
              }}
            >
              AI ARCHIVE
            </span>
          </motion.h1>

          <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:items-end">
            <motion.p variants={rise} className="text-xl font-semibold leading-snug tracking-[-0.02em] text-white/90 md:col-span-6 md:text-3xl">
              직업별로 정리한
              <br />
              AI 에이전트 &amp; 툴 아카이브<span className="caret ml-1 inline-block h-[0.9em] w-[0.45em] translate-y-[0.1em] bg-white/80" />
            </motion.p>
            <motion.dl variants={rise} className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 font-mono md:col-span-6 md:ml-auto md:w-full md:max-w-[460px]">
              {[
                ["CATEGORIES", String(ARCHIVE.length).padStart(2, "0")],
                ["FIELDS", String(ARCHIVE.reduce((n, c) => n + c.fields.length, 0)).padStart(2, "0")],
                ["TOOLS", String(totalTools).padStart(2, "0")],
              ].map(([k, v]) => (
                <div key={k} className="bg-ink/80 px-4 py-4 backdrop-blur">
                  <dt className="text-[9px] tracking-[0.22em] text-white/40">{k}</dt>
                  <dd className="mt-1 font-display text-3xl font-medium text-white">{v}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* ── Bento grid ──────────────────────────────── */}
        <motion.div variants={rise} className="mb-5 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-white/45">
          <span>{"// "}SELECT A PROFESSION</span>
          <span className="hidden md:inline">CLICK TO ENTER MIND MAP →</span>
        </motion.div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {ARCHIVE.map((c, i) => (
            <CategoryCard
              key={c.slug}
              category={c}
              size="tall"
              className="min-h-[380px]"
              hovered={hovered === c.slug}
              dimmed={hovered !== null && hovered !== c.slug}
              onHover={setHovered}
              onOpen={open}
              ready={ready}
              order={i}
            />
          ))}
        </section>

        {/* ── Marquee ─────────────────────────────────── */}
        <motion.div variants={rise} className="relative mt-16 overflow-hidden border-y border-white/10 py-5 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-2xl font-medium tracking-tight text-white/25 md:text-4xl">
            {[...ALL_TOOL_NAMES, ...ALL_TOOL_NAMES].map((n, i) => (
              <span key={i} className="flex items-center gap-10">
                {n}
                <span className="text-sm text-white/20">✦</span>
              </span>
            ))}
          </div>
        </motion.div>

        <motion.footer variants={rise} className="flex flex-col gap-2 pt-8 font-mono text-[10px] tracking-[0.2em] text-white/35 md:flex-row md:justify-between">
          <span>© 2026 AI ARCHIVE — CURATED BY HAND</span>
          <span>툴 정보 {ARCHIVE_CHECKED.replaceAll("-", ".")} 기준</span>
        </motion.footer>
      </motion.div>

      <AnimatePresence>{expanding && <ExpandOverlay {...expanding} onDone={() => router.push(`/${expanding.category.slug}`)} />}</AnimatePresence>
    </main>
  );
}

/** Card → full-screen zoom. Grows from the clicked card's rect, then navigates. */
function ExpandOverlay({ category, rect, onDone }: { category: Category; rect: DOMRect; onDone: () => void }) {
  const { accent } = category;
  return (
    <motion.div
      className="fixed z-[70] overflow-hidden border"
      style={{ borderColor: `${accent}` }}
      initial={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 28, backgroundColor: "rgba(12,12,12,0.6)" }}
      animate={{ top: 0, left: 0, width: "100vw", height: "100dvh", borderRadius: 0, backgroundColor: "rgba(5,5,5,1)" }}
      transition={{ type: "spring", stiffness: 90, damping: 18, mass: 0.9 }}
      onAnimationComplete={onDone}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        style={{ background: `radial-gradient(circle at 20% 50%, ${accent}40, transparent 55%)` }}
      />
      <div className="absolute left-[8vw] top-1/2 -translate-y-1/2">
        <div className="font-mono text-[11px] tracking-[0.2em]" style={{ color: accent }}>
          [{category.index}] {"// "}{category.nameEn}
        </div>
        <div className="mt-3 text-6xl font-extrabold tracking-[-0.04em] text-white md:text-8xl">{category.name}</div>
        <div className="mt-4 h-px w-40 overflow-hidden bg-white/10">
          <motion.div className="h-full" style={{ background: accent }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} />
        </div>
      </div>
    </motion.div>
  );
}
