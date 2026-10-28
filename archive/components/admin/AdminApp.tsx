"use client";

import { useEffect, useMemo, useState } from "react";
import {
  avg, buildSessions, byHour, cleanData, countBy, crossTab, demoData, distribution, ENTRY_NAMES, eventsCsv, funnel, kst, pageName, pageTimes,
  recentEvents, sessionsCsv, summary, surveySeconds, topClicks, type Dataset, type Period, type Question, type SessionRow,
} from "@/lib/analytics";

// 최근 기록 목록에 보일 이름
const EVENT_NAMES: Record<string, string> = {
  session_start: "방문 시작", session_end: "방문 끝", page_view: "페이지 열기", page_leave: "페이지 떠남", click: "누름",
  survey_open: "설문 열기", survey_start: "설문 시작", survey_answer: "설문 답", survey_complete: "설문 완료", survey_close: "설문 닫기",
  game_plan: "게임 추천 받음", raffle_enter: "추첨 응모", raffle_skip: "추첨 건너뜀", home_pick: "첫 화면에서 다시 고름", go_home: "첫 화면으로 감",
};
const END_NAMES: Record<string, string> = { idle: "아무것도 안 누름", home: "처음으로 버튼", exit: "나가기 버튼", restart: "새 손님 시작", return: "첫 화면으로 돌아옴" };

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const TOKEN_KEY = "kiosk.admin.token";

/* ───────── Supabase (REST) ───────── */
async function login(email: string, password: string) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error_description || j.msg || "로그인 실패");
  return j.access_token as string;
}
async function fetchAll<T>(token: string, table: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${table}?select=*&order=created_at.asc`, {
      headers: { apikey: KEY, Authorization: `Bearer ${token}`, Range: `${from}-${from + 999}`, "Range-Unit": "items" },
    });
    if (r.status === 401) throw new Error("AUTH");
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
    const rows = (await r.json()) as T[];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}
async function deleteRaffles(token: string) {
  const r = await fetch(`${URL_}/rest/v1/raffle_entries?id=gt.0`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await r.text());
}

function download(name: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ───────── 화면 ───────── */
export function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [qs, setQs] = useState<Question[]>([]);
  const [data, setData] = useState<Dataset | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    fetch("/kiosk/questions.json").then((r) => r.json()).then((d) => setQs(d.questions)).catch(() => setErr("questions.json 을 불러오지 못했어요"));
    const t = sessionStorage.getItem(TOKEN_KEY);
    if (t) requestAnimationFrame(() => setToken(t));
  }, []);

  const load = async (t: string) => {
    setLoading(true);
    setErr("");
    try {
      const [sessions, events, surveys, raffles] = await Promise.all([
        fetchAll<Dataset["sessions"][number]>(t, "sessions"),
        fetchAll<Dataset["events"][number]>(t, "events"),
        fetchAll<Dataset["surveys"][number]>(t, "survey_responses"),
        fetchAll<Dataset["raffles"][number]>(t, "raffle_entries"),
      ]);
      setData({ sessions, events, surveys, raffles });
      setUpdatedAt(new Date());
    } catch (e) {
      if ((e as Error).message === "AUTH") {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setErr("로그인이 만료됐어요. 다시 로그인해 주세요.");
      } else setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || demo) return;
    requestAnimationFrame(() => void load(token));
    // 30초마다 자동 새로고침 (설문·이용 기록이 들어오는지 바로 보이게)
    const id = setInterval(() => void load(token), 30000);
    return () => clearInterval(id);
  }, [token, demo]);

  // 예전 전송 버그로 두 번 들어간 기록을 빼고, 시험 기기(test-…)는 기본으로 빼요
  const clean = useMemo(() => (data ? cleanData(data, includeTest) : null), [data, includeTest]);

  useEffect(() => {
    if (demo && qs.length) requestAnimationFrame(() => { setData(demoData(qs)); setUpdatedAt(new Date()); });
  }, [demo, qs]);

  if (!token && !demo) return <Login onToken={(t) => { sessionStorage.setItem(TOKEN_KEY, t); setToken(t); }} onDemo={() => setDemo(true)} err={err} />;
  if (!clean || !qs.length) return <Shell><p className="text-white/60">{loading ? "불러오는 중…" : err || "준비 중…"}</p></Shell>;
  return (
    <Dashboard
      data={clean}
      qs={qs}
      demo={demo}
      updatedAt={updatedAt}
      loading={loading}
      includeTest={includeTest}
      onIncludeTest={setIncludeTest}
      onReload={() => (demo ? setData(demoData(qs)) : token && load(token))}
      onLogout={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(null); setDemo(false); setData(null); }}
      onDeleteRaffles={async () => { if (token) { await deleteRaffles(token); await load(token); } }}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-dvh max-w-6xl px-4 py-8 text-[#ededed] md:px-8">{children}</main>;
}

function Login({ onToken, onDemo, err }: { onToken: (t: string) => void; onDemo: () => void; err: string }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(err);
  const configured = !!(URL_ && KEY);
  return (
    <Shell>
      <div className="mx-auto mt-[10vh] max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-7">
        <div className="font-mono text-[11px] tracking-[0.2em] text-[#00F0FF]">AI_KIOSK · ADMIN</div>
        <h1 className="mt-2 text-2xl font-extrabold">이용 기록 · 설문 분석</h1>
        {configured ? (
          <form
            className="mt-6 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setMsg("");
              try { onToken(await login(email, pw)); } catch (x) { setMsg((x as Error).message); }
            }}
          >
            <input className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#00F0FF]" type="email" placeholder="관리자 이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-[#00F0FF]" type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} required />
            <button className="w-full rounded-xl bg-[#00F0FF] py-3 font-bold text-black">로그인</button>
          </form>
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-white/60">아직 Supabase 가 연결되지 않았어요. 환경 변수 <code className="text-[#00F0FF]">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="text-[#00F0FF]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를 설정하면 로그인할 수 있어요.</p>
        )}
        {msg && <p className="mt-3 text-sm text-[#FF4D6D]">{msg}</p>}
        <button onClick={onDemo} className="mt-5 w-full rounded-xl border border-white/15 py-2.5 text-sm text-white/70">예시 데이터로 화면 미리보기</button>
      </div>
    </Shell>
  );
}

/* ───────── 대시보드 ───────── */
function Dashboard({ data, qs, demo, updatedAt, loading, includeTest, onIncludeTest, onReload, onLogout, onDeleteRaffles }: {
  data: Dataset; qs: Question[]; demo: boolean; updatedAt: Date | null; loading: boolean; includeTest: boolean; onIncludeTest: (v: boolean) => void;
  onReload: () => void; onLogout: () => void; onDeleteRaffles: () => Promise<void>;
}) {
  const [period, setPeriod] = useState<Period>("all");
  const [kiosk, setKiosk] = useState("all");
  const [crossQ, setCrossQ] = useState("q3");
  const kiosks = useMemo(() => [...new Set(data.sessions.map((s) => s.kiosk_id ?? "-"))], [data]);
  const rows = useMemo(() => buildSessions(data, period, kiosk), [data, period, kiosk]);
  const sum = summary(rows, data, period, kiosk);
  const pages = pageTimes(rows);
  const clicks = topClicks(data, rows);
  const entries = countBy(rows, (r) => r.entry);
  const opened = countBy(rows.filter((r) => r.survey), (r) => r.survey!.opened_on);
  const hours = byHour(rows);
  const topPages = pages.slice(0, 4).map((p) => p.page);
  const q = qs.find((x) => x.id === crossQ)!;
  const cross = crossTab(q, rows, topPages);
  const details = qs.flatMap((qq) => rows.filter((r) => r.survey?.details?.[qq.id]).map((r) => ({ q: qq, text: r.survey!.details![qq.id], at: r.startedAt })));
  const stamp = new Date().toISOString().slice(0, 10);
  const flow = funnel(rows, data);
  const surveySec = surveySeconds(rows);
  const recent = recentEvents(data, rows);
  // 게임 만들기 AI 추천: 손님이 적은 게임과 고른 예산 (최신이 위)
  const keep = new Set(rows.map((r) => r.id));
  const games = data.events.filter((e) => e.type === "game_plan" && keep.has(e.session_id)).sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <Shell>
      {demo && <div className="mb-4 rounded-xl border border-[#FF6B00]/40 bg-[#FF6B00]/10 px-4 py-2 text-sm text-[#ffb37a]">예시 데이터로 보는 미리보기예요. 실제 기록이 아니에요.</div>}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#00F0FF]">AI_KIOSK · ADMIN</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">이용 기록 · 설문 분석</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs text-white/45">
            {loading ? "불러오는 중…" : updatedAt ? `마지막 갱신 ${updatedAt.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })}` : ""}
            {!demo && " · 30초마다 자동 새로고침"}
          </span>
          <button onClick={onReload} className="rounded-xl border border-white/15 px-3 py-2">새로고침</button>
          <button onClick={onLogout} className="rounded-xl border border-white/15 px-3 py-2 text-white/60">{demo ? "나가기" : "로그아웃"}</button>
        </div>
      </header>

      {/* 필터: 한 줄, 모든 차트에 적용 */}
      <div className="sticky top-0 z-10 -mx-4 mt-5 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#050505]/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Seg value={period} onChange={(v) => setPeriod(v as Period)} options={[["all", "전체"], ["today", "오늘"], ["7d", "7일"], ["30d", "30일"]]} />
        <select value={kiosk} onChange={(e) => setKiosk(e.target.value)} className="rounded-xl border border-white/15 bg-black px-3 py-2 text-sm">
          <option value="all">모든 키오스크</option>
          {kiosks.map((k) => <option key={k} value={k}>{k === "web" ? "키오스크 밖 방문" : k}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-white/60">
          <input type="checkbox" checked={includeTest} onChange={(e) => onIncludeTest(e.target.checked)} /> 시험 기록 포함
        </label>
        <div className="ml-auto flex gap-2 text-sm">
          <button onClick={() => download(`세션요약_${stamp}.csv`, sessionsCsv(rows, qs))} className="rounded-xl bg-[#00F0FF] px-3 py-2 font-bold text-black">CSV: 사람별 요약 + 설문</button>
          <button onClick={() => download(`이용기록_${stamp}.csv`, eventsCsv(data, rows))} className="rounded-xl border border-white/15 px-3 py-2">CSV: 전체 이용 기록</button>
        </div>
      </div>

      {/* 핵심 숫자 */}
      <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile label="방문(세션)" value={`${sum.sessions}명`} hero />
        <Tile label="평균 이용 시간" value={`${sum.avgMinutes.toFixed(1)}분`} />
        <Tile label="설문 시작" value={pct(sum.surveyStartRate)} sub="방문 대비" />
        <Tile label="설문 완료" value={pct(sum.surveyCompleteRate)} sub={`시작 대비 · ${sum.completed}명`} />
        <Tile label="추첨 응모" value={`${sum.raffles}명`} />
      </section>

      <Card title="단계별 흐름" sub="방문한 사람 중 몇 명이 다음 단계까지 갔는지 · 괄호 = 바로 앞 단계 대비" className="mt-4">
        <HBars items={flow.map((f) => ({ label: f.label, value: f.count, text: `${f.count}명 · ${pct(f.ofFirst)}${f.label === "방문" ? "" : ` (${pct(f.ofPrev)})`}` }))} />
        <p className="mt-3 text-sm text-white/55">
          설문 완료까지 걸린 시간: {surveySec.length ? `평균 ${Math.round(avg(surveySec))}초 · ${surveySec.length}명 기준` : "아직 완료한 사람이 없어요"}
        </p>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="첫 화면에서 고른 버튼">
          <HBars items={entries.map(([k, v]) => ({ label: ENTRY_NAMES[k] ?? k, value: v, text: `${v}명 · ${pct(v / Math.max(1, rows.length))}` }))} />
        </Card>
        <Card title="설문을 연 페이지">
          <HBars items={opened.map(([k, v]) => ({ label: pageName(k), value: v, text: `${v}명` }))} empty="아직 설문 응답이 없어요" />
        </Card>
        <Card title="페이지별 머문 시간" sub="막대 = 총 머문 시간 · 오른쪽 = 방문 1회 평균">
          <HBars items={pages.map((p) => ({ label: pageName(p.page), value: p.totalMin, text: `${p.totalMin.toFixed(1)}분 · 평균 ${Math.round(p.avgSec)}초` }))} />
        </Card>
        <Card title="많이 누른 것 TOP 15" sub="페이지 · 버튼(또는 노드)">
          <HBars items={clicks.map((c) => ({ label: `${c.label}`, hint: pageName(c.page), value: c.count, text: `${c.count}회` }))} empty="아직 클릭 기록이 없어요" />
        </Card>
      </div>

      <Card title="시간대별 방문" sub="한국 시간 · 시작한 시각 기준" className="mt-4">
        <Columns values={hours} />
      </Card>

      {/* 교차 분석 */}
      <Card title="교차 분석: 설문 답 × 이용 기록" sub="같은 답을 고른 사람들끼리 평균을 비교해요 · 칸이 밝을수록 그 열에서 값이 커요" className="mt-4">
        <select value={crossQ} onChange={(e) => setCrossQ(e.target.value)} className="mb-3 w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-sm md:w-auto">
          {qs.map((x) => <option key={x.id} value={x.id}>{x.no}. {x.title}</option>)}
        </select>
        <CrossTable rows={cross} pages={topPages} />
      </Card>

      {/* 문항별 분포 */}
      <h2 className="mt-10 text-xl font-extrabold">문항별 응답</h2>
      <p className="text-sm text-white/50">막대 = 그 문항에 답한 사람 중 고른 비율 (복수 선택은 합이 100%를 넘을 수 있어요)</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {qs.map((qq) => {
          const d = distribution(qq, rows);
          return (
            <Card key={qq.id} title={`${qq.no}. ${qq.title}`} sub={`응답 ${d.n}명${qq.type === "multi" ? " · 복수 선택" : ""}`}>
              <HBars items={d.items.map((it) => ({ label: it.label, value: it.pct, text: `${Math.round(it.pct * 100)}% · ${it.count}명` }))} max={1} empty="응답이 없어요" />
            </Card>
          );
        })}
      </div>

      <Card title="자세히 쓰기 (서술 답변)" sub={`${details.length}개`} className="mt-4">
        {details.length ? (
          <ul className="divide-y divide-white/5 text-sm">
            {details.map((d, i) => (
              <li key={i} className="py-2.5"><span className="mr-2 text-white/40">{d.q.no}번</span>{d.text}<span className="ml-2 text-xs text-white/30">{kst(d.at)}</span></li>
            ))}
          </ul>
        ) : <p className="text-sm text-white/40">아직 없어요</p>}
      </Card>

      <Raffle data={data} demo={demo} onDelete={onDeleteRaffles} />

      <Card title={`게임 만들기 AI 추천 · ${games.length}번`} sub="손님이 적은 게임과 고른 예산 · 최신이 위 · 최근 30개" className="mt-4">
        {games.length ? (
          <ul className="divide-y divide-white/5 text-sm">
            {games.slice(0, 30).map((e, i) => {
              const m = (e.meta ?? {}) as { text?: string; picks?: string[]; total?: number; source?: string };
              return (
                <li key={i} className="py-2">
                  <div className="flex flex-wrap gap-x-3">
                    <span className="text-white/40">{kst(e.ts)}</span>
                    <span className="text-[#C6FF00]">{e.target}</span>
                    <span className="text-white/40">{m.source === "gemini" ? "Gemini 해석" : "키워드 해석"}</span>
                  </div>
                  <p className="mt-0.5 text-white/85">{m.text}</p>
                  {m.picks && <p className="text-xs text-white/45">추천: {m.picks.join(", ")} · 시작 비용 월 {(m.total ?? 0).toLocaleString("ko-KR")}원</p>}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-white/40">아직 없어요</p>}
      </Card>

      <Card title="최근 기록 20개" sub="기록이 실제로 들어오는지 바로 확인해요 · 한국 시간" className="mt-4">
        {recent.length ? (
          <ul className="divide-y divide-white/5 text-sm">
            {recent.map((e, i) => (
              <li key={i} className="flex flex-wrap gap-x-3 py-2">
                <span className="text-white/40">{kst(e.ts)}</span>
                <span className="text-[#00F0FF]">{EVENT_NAMES[e.type] ?? e.type}</span>
                <span className="text-white/70">{pageName(e.page)}</span>
                {e.target && <span className="text-white/50">{END_NAMES[e.target] ?? e.target}</span>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-white/40">아직 기록이 없어요</p>}
      </Card>

      <Card title="사람별 기록" sub="최근 50명 · 전체는 CSV 로" className="mt-4">
        <SessionTable rows={rows} />
      </Card>
    </Shell>
  );
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex rounded-xl border border-white/15 p-0.5 text-sm">
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={`rounded-lg px-3 py-1.5 ${value === k ? "bg-[#00F0FF]/15 font-bold text-[#00F0FF]" : "text-white/60"}`}>{l}</button>
      ))}
    </div>
  );
}

function Card({ title, sub, children, className = "" }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-[#111113] p-5 ${className}`}>
      <h3 className="font-bold">{title}</h3>
      {sub && <p className="mt-0.5 text-xs text-white/45">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Tile({ label, value, sub, hero }: { label: string; value: string; sub?: string; hero?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111113] p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className={`mt-1 font-semibold tracking-tight ${hero ? "text-4xl text-white" : "text-2xl text-white/90"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

/* 가로 막대: 한 가지 색(단일 계열), 값은 막대 끝에 글자로 */
function HBars({ items, max, empty }: { items: { label: string; hint?: string; value: number; text: string }[]; max?: number; empty?: string }) {
  if (!items.length || items.every((i) => !i.value)) return <p className="text-sm text-white/40">{empty ?? "데이터가 없어요"}</p>;
  const m = max ?? Math.max(...items.map((i) => i.value));
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label + (it.hint ?? "")} className="group" title={`${it.label}${it.hint ? ` (${it.hint})` : ""}: ${it.text}`}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-white/85">{it.label}{it.hint && <span className="ml-1.5 text-[11px] text-white/35">{it.hint}</span>}</span>
            <span className="shrink-0 tabular-nums text-white/60">{it.text}</span>
          </div>
          <div className="mt-1 h-[10px] rounded-r bg-white/[0.04]">
            <div className="h-full rounded-r-[4px] bg-[#00F0FF] opacity-80 transition-opacity group-hover:opacity-100" style={{ width: `${m ? (it.value / m) * 100 : 0}%`, minWidth: it.value ? 2 : 0 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* 세로 막대 (시간대): 최댓값만 숫자 표시, 나머지는 마우스를 올리면 */
function Columns({ values }: { values: number[] }) {
  const m = Math.max(1, ...values);
  const top = values.indexOf(Math.max(...values));
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px] border-b border-white/15">
        {values.map((v, h) => (
          <div key={h} className="group relative flex h-full flex-1 items-end" title={`${h}시: ${v}명`}>
            {h === top && v > 0 && <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[11px] text-white/70">{v}</span>}
            <div className="mx-auto w-full max-w-[22px] rounded-t-[4px] bg-[#00F0FF] opacity-75 group-hover:opacity-100" style={{ height: `${(v / m) * 100}%` }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[11px] group-hover:block">{h}시 · {v}명</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex text-[11px] text-white/40">
        {values.map((_, h) => <span key={h} className="flex-1 text-center">{h % 3 === 0 ? h : ""}</span>)}
      </div>
    </div>
  );
}

/* 교차표: 열마다 밝기(한 가지 색의 진하기)로 크기 표시 + 숫자 */
function CrossTable({ rows, pages }: { rows: ReturnType<typeof crossTab>; pages: string[] }) {
  if (!rows.length) return <p className="text-sm text-white/40">이 문항에 답한 사람이 없어요</p>;
  const cols: { key: string; head: string; get: (r: (typeof rows)[number]) => number; fmt: (v: number) => string }[] = [
    { key: "n", head: "사람 수", get: (r) => r.n, fmt: (v) => `${v}명` },
    { key: "min", head: "평균 이용 시간", get: (r) => r.avgMin, fmt: (v) => `${v.toFixed(1)}분` },
    { key: "clk", head: "평균 클릭", get: (r) => r.avgClicks, fmt: (v) => `${v.toFixed(1)}회` },
    ...pages.map((p) => ({ key: p, head: `${pageName(p)} (초)`, get: (r: (typeof rows)[number]) => r.pageSec[p], fmt: (v: number) => `${Math.round(v)}` })),
  ];
  const maxOf = Object.fromEntries(cols.map((c) => [c.key, Math.max(1e-9, ...rows.map(c.get))]));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-[13px]">
        <thead>
          <tr className="text-left text-white/50">
            <th className="px-2 py-1.5 font-medium">답</th>
            {cols.map((c) => <th key={c.key} className="px-2 py-1.5 text-right font-medium">{c.head}</th>)}
            <th className="px-2 py-1.5 font-medium">가장 많이 누른 것</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="whitespace-nowrap px-2 py-1.5 text-white/85">{r.label}</td>
              {cols.map((c) => {
                const v = c.get(r);
                return (
                  <td key={c.key} className="rounded px-2 py-1.5 text-right tabular-nums text-white" style={{ background: `rgba(0,240,255,${0.05 + 0.4 * (v / maxOf[c.key])})` }}>
                    {c.fmt(v)}
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-white/60">{r.topClick}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionTable({ rows }: { rows: SessionRow[] }) {
  const recent = [...rows].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 50);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead className="text-left text-white/45">
          <tr><th className="py-1.5">시작</th><th>시작 버튼</th><th className="text-right">이용</th><th className="text-right">클릭</th><th>설문</th><th>끝난 이유</th><th>키오스크</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {recent.map((r) => (
            <tr key={r.id}>
              <td className="py-1.5 tabular-nums">{kst(r.startedAt)}</td>
              <td>{ENTRY_NAMES[r.entry] ?? r.entry}</td>
              <td className="text-right tabular-nums">{(r.durationMs / 60000).toFixed(1)}분</td>
              <td className="text-right tabular-nums">{r.clicks}</td>
              <td>{r.survey ? (r.survey.completed ? "완료" : `중단 (${r.survey.last_question ?? "-"})`) : "-"}</td>
              <td className="text-white/60">{({ idle: "무반응", home: "처음으로", restart: "새 사람", return: "첫 화면 복귀" } as Record<string, string>)[r.endReason] ?? r.endReason}</td>
              <td className="text-white/50">{r.kiosk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* 추첨: 명단(가림) · 무작위 추첨 · 발송 후 일괄 삭제 */
function Raffle({ data, demo, onDelete }: { data: Dataset; demo: boolean; onDelete: () => Promise<void> }) {
  const [show, setShow] = useState(false);
  const [n, setN] = useState(3);
  const [winners, setWinners] = useState<string[]>([]);
  const list = data.raffles;
  const mask = (p: string) => (show ? p.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3") : p.replace(/^(\d{3})(\d{3,4})(\d{4})$/, (_, a, b, c) => `${a}-${"*".repeat(b.length)}-${c}`));
  const draw = () => {
    const pool = [...list.map((r) => r.phone)];
    const out: string[] = [];
    while (out.length < Math.min(n, pool.length)) out.push(pool.splice(Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * pool.length), 1)[0]);
    setWinners(out);
  };
  return (
    <Card title="☕ 추첨" sub={`응모 ${list.length}명 · 연락처는 설문과 연결되지 않아요 · 발송 후에는 꼭 삭제하세요`} className="mt-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">당첨 인원 <input type="number" min={1} value={n} onChange={(e) => setN(Math.max(1, +e.target.value))} className="w-16 rounded-lg border border-white/15 bg-black px-2 py-1.5" /></label>
        <button onClick={draw} disabled={!list.length} className="rounded-xl bg-[#00F0FF] px-4 py-2 font-bold text-black disabled:opacity-40">무작위 추첨</button>
        <button onClick={() => setShow((s) => !s)} className="rounded-xl border border-white/15 px-3 py-2">{show ? "번호 가리기" : "번호 전체 보기"}</button>
        <button
          disabled={demo || !list.length}
          onClick={async () => { if (confirm(`응모자 ${list.length}명의 연락처를 모두 삭제할까요? 되돌릴 수 없어요.`)) await onDelete(); }}
          className="ml-auto rounded-xl border border-[#FF4D6D]/50 px-3 py-2 text-[#FF4D6D] disabled:opacity-30"
        >
          경품 발송 완료 · 연락처 전체 삭제
        </button>
      </div>
      {winners.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#C6FF00]/40 bg-[#C6FF00]/[0.06] p-3">
          <div className="text-xs text-[#C6FF00]">당첨 ({kst(new Date().toISOString())})</div>
          <div className="mt-1 flex flex-wrap gap-2 font-semibold">{winners.map((w) => <span key={w}>{mask(w)}</span>)}</div>
        </div>
      )}
      <div className="mt-3 flex max-h-40 flex-wrap gap-x-4 gap-y-1 overflow-y-auto text-[13px] tabular-nums text-white/60">
        {list.map((r) => <span key={r.id}>{mask(r.phone)}</span>)}
      </div>
    </Card>
  );
}
