// 키오스크 이용 기록 + 설문 분석 (관리자 페이지 /admin 에서 사용)

export type Question = {
  id: string;
  no: number;
  sec: string;
  title: string;
  type: "single" | "multi" | "scale";
  options: string[];
  extra?: string;
  max?: number;
};
export type Session = { id: string; started_at: string; entry: string | null; kiosk_id: string | null };
export type Event = { session_id: string; ts: string; type: string; page: string | null; target: string | null; duration_ms: number | null; meta: Record<string, unknown> | null };
export type Survey = {
  session_id: string;
  opened_on: string | null;
  started_at: string | null;
  finished_at: string | null;
  completed: boolean;
  last_question: string | null;
  answers: Record<string, string | string[] | null> | null;
  details: Record<string, string> | null;
  kiosk_id: string | null;
};
export type Raffle = { id: number; phone: string; consented_at: string; kiosk_id: string | null; created_at: string };
export type Dataset = { sessions: Session[]; events: Event[]; surveys: Survey[]; raffles: Raffle[] };

/* 페이지 이름 */
const PAGE_NAMES: Record<string, string> = {
  "/kiosk": "키오스크 첫 화면",
  "/news": "AI 소식 (큐레이터)",
  "/": "AI ARCHIVE 첫 화면",
  "/developer": "마인드맵 · 개발자",
  "/designer": "마인드맵 · 디자이너",
  "/study": "마인드맵 · 공부",
  "/video": "마인드맵 · 영상 편집",
};
export const pageName = (p: string | null) => (p ? PAGE_NAMES[p] ?? p : "(알 수 없음)");
export const ENTRY_NAMES: Record<string, string> = { news: "AI 소식", archive: "작업별 AI 추천", direct: "첫 화면 거치지 않음" };

/* 기간 · 키오스크 필터 */
export type Period = "all" | "today" | "7d" | "30d";
export function inPeriod(iso: string, period: Period, now = new Date()) {
  if (period === "all") return true;
  const t = new Date(iso).getTime();
  if (period === "today") {
    const kst = new Date(now.getTime() + 9 * 3600e3);
    const start = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600e3;
    return t >= start;
  }
  const days = period === "7d" ? 7 : 30;
  return t >= now.getTime() - days * 86400e3;
}

export type SessionRow = {
  id: string;
  startedAt: string;
  entry: string;
  kiosk: string;
  durationMs: number;
  endReason: string;
  clicks: number;
  pageMs: Record<string, number>;
  survey: Survey | null;
  surveyStarted: boolean;
  topClick: string | null;
};

/* 세션 단위로 묶기 */
export function buildSessions(d: Dataset, period: Period, kiosk: string): SessionRow[] {
  const sessions = d.sessions.filter((s) => inPeriod(s.started_at, period) && (kiosk === "all" || s.kiosk_id === kiosk));
  const keep = new Set(sessions.map((s) => s.id));
  const evBy = new Map<string, Event[]>();
  for (const e of d.events) if (keep.has(e.session_id)) (evBy.get(e.session_id) ?? evBy.set(e.session_id, []).get(e.session_id)!).push(e);
  const svBy = new Map<string, Survey>();
  for (const s of d.surveys) {
    if (!keep.has(s.session_id)) continue;
    const prev = svBy.get(s.session_id);
    if (!prev || (s.completed && !prev.completed)) svBy.set(s.session_id, s);
  }
  return sessions.map((s) => {
    const ev = (evBy.get(s.id) ?? []).sort((a, b) => a.ts.localeCompare(b.ts));
    const end = ev.find((e) => e.type === "session_end");
    const lastTs = ev.length ? new Date(ev[ev.length - 1].ts).getTime() : new Date(s.started_at).getTime();
    const pageMs: Record<string, number> = {};
    for (const e of ev) if (e.type === "page_leave" && e.page) pageMs[e.page] = (pageMs[e.page] ?? 0) + (e.duration_ms ?? 0);
    const clicksEv = ev.filter((e) => e.type === "click");
    const counts = new Map<string, number>();
    for (const c of clicksEv) if (c.target && c.target !== "(빈 곳)") counts.set(c.target, (counts.get(c.target) ?? 0) + 1);
    const topClick = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      id: s.id,
      startedAt: s.started_at,
      entry: s.entry ?? "direct",
      kiosk: s.kiosk_id ?? "-",
      durationMs: end?.duration_ms ?? Math.max(0, lastTs - new Date(s.started_at).getTime()),
      endReason: end?.target ?? "(진행 중)",
      clicks: clicksEv.length,
      pageMs,
      survey: svBy.get(s.id) ?? null,
      surveyStarted: ev.some((e) => e.type === "survey_start") || svBy.has(s.id),
      topClick,
    };
  });
}

export const minutes = (ms: number) => ms / 60000;
export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function summary(rows: SessionRow[], d: Dataset, period: Period, kiosk: string) {
  const started = rows.filter((r) => r.surveyStarted);
  const completed = rows.filter((r) => r.survey?.completed);
  const raffles = d.raffles.filter((r) => inPeriod(r.created_at, period) && (kiosk === "all" || r.kiosk_id === kiosk));
  return {
    sessions: rows.length,
    avgMinutes: avg(rows.map((r) => minutes(r.durationMs))),
    surveyStartRate: rows.length ? started.length / rows.length : 0,
    surveyCompleteRate: started.length ? completed.length / started.length : 0,
    completed: completed.length,
    raffles: raffles.length,
  };
}

export function countBy<T>(xs: T[], key: (x: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const x of xs) {
    const k = key(x);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/* 페이지별 머문 시간 */
export function pageTimes(rows: SessionRow[]) {
  const m = new Map<string, { total: number; visits: number }>();
  for (const r of rows)
    for (const [p, ms] of Object.entries(r.pageMs)) {
      const v = m.get(p) ?? { total: 0, visits: 0 };
      v.total += ms;
      v.visits += 1;
      m.set(p, v);
    }
  return [...m.entries()]
    .map(([page, v]) => ({ page, totalMin: minutes(v.total), avgSec: v.total / v.visits / 1000, visits: v.visits }))
    .sort((a, b) => b.totalMin - a.totalMin);
}

/* 많이 누른 것 */
export function topClicks(d: Dataset, rows: SessionRow[], n = 15) {
  const keep = new Set(rows.map((r) => r.id));
  const m = new Map<string, { label: string; page: string; count: number }>();
  for (const e of d.events) {
    if (e.type !== "click" || !keep.has(e.session_id) || !e.target || e.target === "(빈 곳)") continue;
    const k = `${e.page}␟${e.target}`;
    const v = m.get(k) ?? { label: e.target, page: e.page ?? "", count: 0 };
    v.count += 1;
    m.set(k, v);
  }
  return [...m.values()].sort((a, b) => b.count - a.count).slice(0, n);
}

/* 문항별 응답 분포 (응답한 사람 수 대비 %) */
export function distribution(q: Question, rows: SessionRow[]) {
  const opts = q.extra ? [...q.options, q.extra] : q.options;
  const counts = new Map(opts.map((o) => [o, 0]));
  let n = 0;
  for (const r of rows) {
    const v = r.survey?.answers?.[q.id];
    if (v == null || (Array.isArray(v) && !v.length)) continue;
    n += 1;
    for (const o of Array.isArray(v) ? v : [v]) counts.set(o, (counts.get(o) ?? 0) + 1);
  }
  return { n, items: opts.map((o) => ({ label: o, count: counts.get(o) ?? 0, pct: n ? (counts.get(o) ?? 0) / n : 0 })) };
}

export const answerList = (v: string | string[] | null | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/* 교차 분석: 설문 답 × 이용 기록 */
export function crossTab(q: Question, rows: SessionRow[], pages: string[]) {
  const opts = q.extra ? [...q.options, q.extra] : q.options;
  return opts
    .map((o) => {
      const g = rows.filter((r) => answerList(r.survey?.answers?.[q.id]).includes(o));
      const clicks = countBy(g, (r) => r.topClick);
      return {
        label: o,
        n: g.length,
        avgMin: avg(g.map((r) => minutes(r.durationMs))),
        avgClicks: avg(g.map((r) => r.clicks)),
        pageSec: Object.fromEntries(pages.map((p) => [p, avg(g.map((r) => (r.pageMs[p] ?? 0) / 1000))])),
        topClick: clicks[0]?.[0] ?? "-",
      };
    })
    .filter((x) => x.n > 0);
}

/* 시간대 (한국 시간) */
export function byHour(rows: SessionRow[]) {
  const h = Array.from({ length: 24 }, () => 0);
  for (const r of rows) h[(new Date(r.startedAt).getUTCHours() + 9) % 24] += 1;
  return h;
}

export const kst = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

/* CSV (엑셀에서 한글이 깨지지 않게 BOM 포함) */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const cell = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

export function sessionsCsv(rows: SessionRow[], qs: Question[]) {
  const pages = [...new Set(rows.flatMap((r) => Object.keys(r.pageMs)))].sort();
  const header = [
    "세션", "시작(한국시간)", "시작 버튼", "키오스크", "이용 시간(초)", "끝난 이유", "클릭 수", "가장 많이 누른 것",
    ...pages.map((p) => `머문 초: ${pageName(p)}`),
    "설문 연 페이지", "설문 완료",
    ...qs.map((q) => `${q.no}. ${q.title}`),
    ...qs.map((q) => `${q.no}. 자세히`),
  ];
  const body = rows.map((r) => [
    r.id, kst(r.startedAt), ENTRY_NAMES[r.entry] ?? r.entry, r.kiosk, Math.round(r.durationMs / 1000), r.endReason, r.clicks, r.topClick ?? "",
    ...pages.map((p) => Math.round((r.pageMs[p] ?? 0) / 1000)),
    r.survey ? pageName(r.survey.opened_on) : "", r.survey ? (r.survey.completed ? "완료" : "중단") : "",
    ...qs.map((q) => answerList(r.survey?.answers?.[q.id]).join(" | ")),
    ...qs.map((q) => r.survey?.details?.[q.id] ?? ""),
  ]);
  return toCsv(header, body);
}

export function eventsCsv(d: Dataset, rows: SessionRow[]) {
  const keep = new Set(rows.map((r) => r.id));
  const ev = d.events.filter((e) => keep.has(e.session_id)).sort((a, b) => a.ts.localeCompare(b.ts));
  return toCsv(
    ["세션", "시각(한국시간)", "종류", "페이지", "대상", "머문 초", "추가 정보"],
    ev.map((e) => [e.session_id, kst(e.ts), e.type, pageName(e.page), e.target, e.duration_ms != null ? Math.round(e.duration_ms / 1000) : "", e.meta ? JSON.stringify(e.meta) : ""]),
  );
}

/* 미리보기용 예시 데이터 (Supabase 연결 전 화면 확인용) */
export function demoData(qs: Question[]): Dataset {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = <T,>(xs: T[], w?: number[]) => {
    if (!w) return xs[Math.floor(rnd() * xs.length)];
    const t = w.reduce((a, b) => a + b, 0);
    let x = rnd() * t;
    for (let i = 0; i < xs.length; i++) if ((x -= w[i]) < 0) return xs[i];
    return xs[xs.length - 1];
  };
  const sessions: Session[] = [], events: Event[] = [], surveys: Survey[] = [], raffles: Raffle[] = [];
  const now = Date.now();
  const clickables: Record<string, string[]> = {
    "/news": ["요금", "급상승", "GPT-6.1 Sol", "Claude Opus 5.5", "진화", "검색: gpt", "알림", "주요 소식 검색", "직업별 AI 찾기"],
    "/": ["개발자 DEVELOPER", "디자이너 DESIGNER", "공부 STUDY", "영상 편집 VIDEO EDITING"],
    "/developer": ["프론트엔드", "백엔드", "Claude Code", "Cursor", "마인드맵 전체 보기", "복사"],
    "/study": ["노트 · 정리", "Gemini Notebook", "튜터 · 질의응답"],
    "/video": ["영상 생성", "Kling", "자막 · 음성"],
  };
  for (let i = 0; i < 64; i++) {
    const id = `demo-${i}`;
    const start = now - rnd() * 6 * 86400e3 - 2 * 3600e3;
    const startIso = new Date(start).toISOString();
    const entry = pick(["news", "archive"], [6, 4]);
    sessions.push({ id, started_at: startIso, entry, kiosk_id: pick(["k-hall", "k-lab"], [7, 3]) });
    let t = start;
    const route = entry === "news" ? ["/news", ...(rnd() < 0.4 ? ["/"] : [])] : ["/", pick(["/developer", "/study", "/video"]), ...(rnd() < 0.3 ? ["/news"] : [])];
    events.push({ session_id: id, ts: startIso, type: "session_start", page: "/kiosk", target: entry, duration_ms: null, meta: null });
    for (const p of route) {
      events.push({ session_id: id, ts: new Date(t).toISOString(), type: "page_view", page: p, target: null, duration_ms: null, meta: null });
      const stay = (20 + rnd() * (p === "/news" ? 160 : 110)) * 1000;
      const n = Math.floor(rnd() * 6);
      for (let k = 0; k < n; k++) events.push({ session_id: id, ts: new Date(t + ((k + 1) * stay) / (n + 1)).toISOString(), type: "click", page: p, target: pick(clickables[p] ?? ["메뉴"]), duration_ms: null, meta: null });
      t += stay;
      events.push({ session_id: id, ts: new Date(t).toISOString(), type: "page_leave", page: p, target: null, duration_ms: stay, meta: null });
    }
    const willSurvey = rnd() < 0.62;
    if (willSurvey) {
      const opened = pick(route);
      events.push({ session_id: id, ts: new Date(t).toISOString(), type: "survey_start", page: opened, target: null, duration_ms: null, meta: null });
      const answers: Record<string, string | string[]> = {};
      const done = rnd() < 0.82;
      const heavy = rnd() < 0.55;
      for (const q of qs) {
        if (q.id === "q13") continue;
        if (!done && rnd() < 0.25) break;
        const opts = q.extra ? [...q.options, q.extra] : q.options;
        if (q.id === "q3") { answers.q3 = heavy ? "거의 매일" : pick(opts, [0, 4, 3, 2, 1]); if (answers.q3 === "거의 안 씀") { answers.q13 = [pick(qs.find((x) => x.id === "q13")!.options)]; break; } continue; }
        if (q.id === "q7" && answers.q6 === "없다") continue;
        if (rnd() < 0.08) continue;
        answers[q.id] = q.type === "multi" ? [...new Set([pick(opts), pick(opts), ...(rnd() < 0.4 ? [pick(opts)] : [])])].slice(0, q.max ?? 3) : pick(opts);
      }
      surveys.push({
        session_id: id, opened_on: opened, started_at: new Date(t).toISOString(), finished_at: new Date(t + 70e3).toISOString(),
        completed: done, last_question: done ? "q12" : "q6", answers,
        details: rnd() < 0.25 ? { q8: pick(["비교표가 있었으면", "한국어 자료가 부족해요", "가격이 헷갈려요"]) } : {}, kiosk_id: null,
      });
      t += 70e3;
      if (done) events.push({ session_id: id, ts: new Date(t).toISOString(), type: "survey_complete", page: opened, target: null, duration_ms: 70e3, meta: null });
      if (done && rnd() < 0.6) raffles.push({ id: i, phone: `010${String(10000000 + Math.floor(rnd() * 89999999))}`, consented_at: new Date(t).toISOString(), kiosk_id: null, created_at: new Date(t).toISOString() });
    }
    events.push({ session_id: id, ts: new Date(t + 120e3).toISOString(), type: "session_end", page: route.at(-1)!, target: pick(["idle", "home"], [7, 3]), duration_ms: t + 120e3 - start, meta: null });
  }
  return { sessions, events, surveys, raffles };
}
