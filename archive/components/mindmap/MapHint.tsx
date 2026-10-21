"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Graph } from "@/lib/graph";

// 키오스크 마인드맵 첫 안내: 분야 → 툴 순서로 "눌러 보세요" 말풍선 (툴을 한 번 누르면 이번 방문 동안 끝)
const DONE_KEY = "kiosk.mapHintDone";
const sessionId = () => {
  try {
    return (JSON.parse(localStorage.getItem("kiosk.session") ?? "null") as { id?: string } | null)?.id ?? "none";
  } catch {
    return "none";
  }
};
const isDone = () => {
  try {
    return localStorage.getItem(DONE_KEY) === sessionId();
  } catch {
    return false;
  }
};

type Box = { x: number; y: number; w: number; h: number; H: number; T: number };

export function MapHint({
  graph,
  root,
  expanded,
  selectedId,
  accent,
}: {
  graph: Graph;
  root: string;
  expanded: Set<string>;
  selectedId: string | null;
  accent: string;
}) {
  const [done, setDone] = useState(isDone);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState<Box | null>(null);

  // 툴을 한 번 열면 안내 끝 (이번 방문 동안 다시 안 보여요)
  if (selectedId && !done) setDone(true);
  useEffect(() => {
    if (!done) return;
    try {
      localStorage.setItem(DONE_KEY, sessionId());
    } catch {
      /* 저장 불가 */
    }
  }, [done]);

  // 처음 화면 맞추기 애니메이션이 끝난 뒤에 보여요
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // 펼친 분야가 없으면 분야들, 있으면 펼친 분야의 툴들 중에서 화면 가운데에 가장 가까운 것을 가리켜요
  const openKey = graph.get(root)!.children.filter((f) => expanded.has(f)).join("|");
  const step = openKey ? "tool" : "field";
  const candidates = useMemo(
    () => (openKey ? openKey.split("|").flatMap((f) => graph.get(f)!.children) : graph.get(root)!.children),
    [graph, root, openKey],
  );
  const current = useRef<string | null>(null);

  // 화면을 옮기거나 확대해도 따라가게 위치를 계속 갱신
  useEffect(() => {
    if (done || !ready) return;
    current.current = null;
    const tick = () => {
      const host = document.querySelector<HTMLElement>(".react-flow");
      if (!host) return setBox(null);
      const hr = host.getBoundingClientRect();
      const rectOf = (id: string) => document.querySelector<HTMLElement>(`.react-flow__node[data-id="${CSS.escape(id)}"]`)?.getBoundingClientRect();
      const inside = (r: DOMRect) => r.left >= hr.left && r.right <= hr.right && r.top >= hr.top + 8 && r.bottom <= hr.bottom - 70;
      let r = current.current ? rectOf(current.current) : undefined;
      if (!r || !inside(r)) {
        // 지금 가리키는 노드가 화면 밖으로 나가면 가운데에 가장 가까운 노드로 바꿔요
        const cx = hr.left + hr.width / 2, cy = hr.top + hr.height / 2;
        let best: { id: string; r: DOMRect; d: number } | null = null;
        for (const id of candidates) {
          const rr = rectOf(id);
          if (!rr || !inside(rr)) continue;
          const d = Math.hypot(rr.left + rr.width / 2 - cx, rr.top + rr.height / 2 - cy);
          if (!best || d < best.d) best = { id, r: rr, d };
        }
        current.current = best?.id ?? null;
        r = best?.r;
      }
      if (!r) return setBox(null);
      // 말풍선 층은 캔버스의 부모(헤더 여백 포함) 기준으로 그려요
      const pr = host.parentElement!.getBoundingClientRect();
      const n = { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height, H: hr.bottom - pr.top, T: hr.top - pr.top };
      setBox((b) => (b && Math.abs(b.x - n.x) < 0.5 && Math.abs(b.y - n.y) < 0.5 && Math.abs(b.w - n.w) < 0.5 && b.H === n.H && b.T === n.T ? b : n));
    };
    tick();
    const id = setInterval(tick, 120);
    return () => clearInterval(id);
  }, [done, ready, candidates]);

  if (done || !ready || !box) return null;

  const text = step === "field" ? "분야를 눌러서 펼쳐 보세요" : "툴을 누르면 사용법·예시 프롬프트가 나와요";
  const above = box.y + box.h / 2 > (box.T + box.H) / 2; // 아래쪽 노드면 위에, 위쪽 노드면 아래에 띄워요
  const cx = box.x + box.w / 2;

  return (
    <div aria-hidden data-map-hint className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {/* 대상 노드 둘레가 숨 쉬듯 빛나요 */}
      <motion.div
        className="absolute rounded-2xl border-2"
        style={{ left: box.x - 6, top: box.y - 6, width: box.w + 12, height: box.h + 12, borderColor: accent }}
        animate={{ opacity: [0.9, 0.25, 0.9], scale: [1, 1.04, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute w-max max-w-[min(380px,calc(100%-24px))] break-keep"
        style={{
          left: `clamp(190px, ${cx}px, calc(100% - 190px))`,
          top: above ? box.y - 14 : box.y + box.h + 14,
          transform: above ? "translate(-50%, -100%)" : "translate(-50%, 0)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: above ? 8 : -8 }}
            animate={{ opacity: 1, y: [0, above ? -5 : 5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.3 }, y: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
            className="flex flex-col items-center"
          >
            {!above && <Arrow accent={accent} up />}
            <div
              className="rounded-2xl border bg-black/85 px-4 py-2.5 text-center text-[15px] font-bold leading-snug text-white backdrop-blur-xl"
              style={{ borderColor: `${accent}aa`, boxShadow: `0 0 28px -6px ${accent}` }}
            >
              <span style={{ color: accent }}>TAP</span> · {text}
            </div>
            {above && <Arrow accent={accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Arrow({ accent, up }: { accent: string; up?: boolean }) {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" className={up ? "rotate-180" : ""}>
      <path d="M0 0h18L9 10Z" fill={accent} />
    </svg>
  );
}
