"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Gamepad2, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Backdrop } from "@/components/ui/Backdrop";
import { GAME_CHECKED, ROLE_NAMES, USD_KRW, type Role } from "@/data/game-tools";
import { BUDGETS, fmtKrw, makePlan, type Budget, type GameIntent, type Plan } from "@/lib/game-plan";
import { monogram } from "@/lib/graph";

const ACCENT = "#C6FF00";
const ROLE_COLOR: Record<Role, string> = {
  code: "#00F0FF",
  art2d: "#FF2E88",
  model3d: "#FF2E88",
  music: "#FFB020",
  sfx: "#A78BFA",
  voice: "#A78BFA",
  story: "#A78BFA",
};

const EXAMPLES = [
  "귀여운 2D 도트 RPG를 혼자 만들고 싶어요. 코딩은 잘 몰라요",
  "친구들이랑 할 3D 레이싱 게임",
  "배경음악이 중요한 리듬 퍼즐 게임",
  "캐릭터 목소리가 나오는 비주얼노벨",
];

const DIM_NAMES = { "2d": "2D", "3d": "3D", unknown: "2D/3D 미정" } as const;
const CODING_NAMES = { none: "코딩 처음", some: "코딩 조금", good: "코딩 가능", unknown: "코딩 실력 미정" } as const;

export function GameApp() {
  const [text, setText] = useState("");
  const [budget, setBudget] = useState<Budget>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ intent: GameIntent; source: string; plan: Plan; budget: Budget } | null>(null);

  // 키오스크 위젯이 <html class="kiosk"> 를 붙이면 화면 키보드로 입력해요
  const [kiosk, setKiosk] = useState(false);
  useEffect(() => {
    const check = () => setKiosk(document.documentElement.classList.contains("kiosk"));
    const id = requestAnimationFrame(check);
    const t = setTimeout(check, 1200);
    return () => { cancelAnimationFrame(id); clearTimeout(t); };
  }, []);

  const openKb = () => {
    if (!kiosk || !window.KIOSK?.openKeyboard) return;
    window.KIOSK.openKeyboard(text, (t) => setText(t), "만들고 싶은 게임");
  };

  const submit = async (input = text, b = budget) => {
    const t = input.trim();
    if (!t) return setErr("만들고 싶은 게임을 적거나 예시를 눌러 주세요");
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/game-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "추천을 만들지 못했어요");
      const plan = makePlan(data.intent, b);
      setResult({ intent: data.intent, source: data.source, plan, budget: b });
      window.KIOSK?.track("game_plan", {
        target: BUDGETS.find((x) => x.value === b)?.label,
        meta: { text: t.slice(0, 200), intent: data.intent, source: data.source, picks: plan.picks.map((p) => p.tool.key), total: plan.total },
      });
      requestAnimationFrame(() => document.getElementById("game-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "추천을 만들지 못했어요");
    } finally {
      setLoading(false);
    }
  };

  const budgetLabel = (b: Budget) => BUDGETS.find((x) => x.value === b)!.label;

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden break-keep px-4 pb-32 pt-6 text-white md:px-10">
      <Backdrop intensity={0.9} />
      <div className="relative z-10 mx-auto max-w-[1000px]">
        <header className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: ACCENT, color: "#050505" }}>
            <Gamepad2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[clamp(20px,4vh,30px)] font-extrabold tracking-[-0.03em]">게임 만들기 AI 추천</h1>
            <p className="text-[13px] text-white/55">만들고 싶은 게임과 한 달 예산을 알려 주면, 필요한 AI 툴 4개를 골라 드려요</p>
          </div>
        </header>

        {/* 입력 */}
        <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <label htmlFor="game-text" className="text-[13px] font-semibold text-white/70">1. 어떤 게임을 만들고 싶나요?</label>
          <textarea
            id="game-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            onClick={openKb}
            readOnly={kiosk}
            rows={2}
            placeholder={kiosk ? "여기를 눌러 적어 주세요" : "예: 귀여운 2D 도트 RPG를 혼자 만들고 싶어요"}
            className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] outline-none focus:border-[#C6FF00]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setText(ex)} data-track={`게임 예시: ${ex.slice(0, 20)}`} className="rounded-full border border-white/12 px-3 py-1.5 text-[12.5px] text-white/70 hover:border-white/30">
                {ex}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[13px] font-semibold text-white/70">2. 한 달 예산</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BUDGETS.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => setBudget(b.value)}
                data-track={`게임 예산: ${b.label}`}
                aria-pressed={budget === b.value}
                className="rounded-xl border px-3 py-2.5 text-[14px] font-semibold"
                style={budget === b.value ? { borderColor: ACCENT, color: "#050505", background: ACCENT } : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
              >
                {b.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => submit()}
            disabled={loading}
            data-track="게임 추천 받기"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[16px] font-bold text-black disabled:opacity-60"
            style={{ background: ACCENT, boxShadow: `0 0 30px -8px ${ACCENT}` }}
          >
            {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {loading ? "고르는 중…" : "AI 툴 4개 추천 받기"}
          </button>
          {err && <p className="mt-2 text-[13px] text-[#FF6B00]">{err}</p>}
          <p className="mt-2 text-[11px] leading-relaxed text-white/35">적은 내용은 게임 종류를 알아내려고 Google Gemini로 보내져요. 추천하는 툴과 가격은 우리가 공식 페이지에서 확인한 자료에서만 골라요.</p>
        </section>

        {/* 결과 */}
        <AnimatePresence>
          {result && (
            <motion.section id="game-result" key={JSON.stringify(result.intent) + result.budget} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 scroll-mt-4">
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="text-white/50">이렇게 알아들었어요:</span>
                {[result.intent.genre ?? "장르 미정", DIM_NAMES[result.intent.dim], CODING_NAMES[result.intent.codingLevel], budgetLabel(result.budget)].map((t) => (
                  <span key={t} className="rounded-full border border-white/15 px-2.5 py-1 text-white/80">{t}</span>
                ))}
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {result.plan.picks.map((p, i) => {
                  const c = ROLE_COLOR[p.role];
                  return (
                    <article key={p.role} className="relative rounded-2xl border bg-[#0b0b0d]/80 p-4" style={{ borderColor: `${c}55` }}>
                      <div className="flex items-center justify-between font-mono text-[11px] tracking-wider" style={{ color: c }}>
                        <span>{String(i + 1).padStart(2, "0")} · {ROLE_NAMES[p.role]}</span>
                        <span className="rounded-full border px-2 py-0.5 font-sans font-semibold" style={{ borderColor: `${c}66` }}>{p.cost === 0 ? "무료로 시작" : `월 ${fmtKrw(p.cost)}`}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-bold text-black" style={{ background: c }}>{monogram(p.tool.name)}</span>
                        <div className="min-w-0">
                          <h3 className="truncate text-[18px] font-bold">{p.tool.name}</h3>
                          <p className="text-[13px] text-white/65">{p.tool.what}</p>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[12.5px] text-white/70">
                        {p.tool.freeStart && p.tool.freeWhat && <li>무료로 되는 것: {p.tool.freeWhat}</li>}
                        {p.paidKrw != null && <li>유료로 올리면: 월 약 {fmtKrw(p.paidKrw)}{p.tool.annualOnly ? " (연 결제 기준)" : ""}</li>}
                        {p.tool.commercialFree === false && <li className="text-[#FFB020]">무료로 만든 결과물은 판매용 게임에 못 써서 유료 요금으로 계산했어요</li>}
                        {p.tool.commercialFree === true && <li>무료로 만든 결과물도 판매용 게임에 쓸 수 있어요</li>}
                        {p.alternatives.length > 0 && <li className="text-white/45">비슷한 후보: {p.alternatives.map((a) => a.name).join(", ")}</li>}
                      </ul>
                      <a href={p.tool.url} target="_blank" rel="noreferrer" data-track={`게임 툴 열기: ${p.tool.name}`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: c }}>
                        공식 사이트 <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </article>
                  );
                })}
              </div>

              {result.plan.missing.length > 0 && (
                <p className="mt-3 text-[13px] text-[#FFB020]">예산 안에서 고를 툴이 없는 일: {result.plan.missing.map((r) => ROLE_NAMES[r]).join(", ")} — 예산을 올려 보세요</p>
              )}
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[14px]">
                시작 비용 합계 <b style={{ color: ACCENT }}>월 {fmtKrw(result.plan.total)}</b>
                {result.budget != null && <span className="text-white/55"> · 예산 {budgetLabel(result.budget)} 안이에요</span>}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                고르는 기준: 만든 결과물을 게임에 넣어 팔 수 있는 조건으로 예산 안 → 그 일이 주력인 툴 → (코딩을 모르면) 초보자용 → 사용자 수(Similarweb 방문) 순 · 무료 결과물을 판매용으로 못 쓰는 툴은 유료 요금으로 계산 · 가격은 공식 요금 페이지의 미국 달러를 1달러 = {USD_KRW.rate.toLocaleString("ko-KR")}원({USD_KRW.date})으로 바꾼 값 · {GAME_CHECKED} 확인
                {result.source === "keyword" && " · 이번에는 키워드로 알아들었어요"}
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
