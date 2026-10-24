/*
 * AI 키오스크 위젯 — 키오스크 모드일 때만 동작해요 (/kiosk 첫 화면에서 켜짐, ?kiosk=0 으로 끔).
 *  - 사용 기록: 세션(한 사람) 단위로 페이지·머문 시간·클릭·설문을 기록 → Supabase (끊기면 임시 저장 후 재전송)
 *  - 키오스크 밖(휴대폰·PC) 방문도 기록만 해요 (kiosk_id "web", 화면 위젯 없음, 30분 쉬면 새 방문)
 *  - 1분(설정값) 무반응이면 세션을 끝내고 첫 화면(/kiosk)으로 복귀 (10초 전 안내). 처음으로·나가기로 첫 화면에 와도 세션은 이어져요
 *  - 첫 화면을 뺀 모든 페이지에 [처음으로] [설문 참여] 버튼
 *  - 설문 14문항 (한 화면 한 문항, 버튼 선택 + 선택 입력란, 화면 한글 키보드), 완료 후 추첨 응모(선택)
 * AI 큐레이터(정적)와 AI ARCHIVE(Next.js) 양쪽에서 같은 파일을 불러 써요.
 */
(() => {
  "use strict";
  if (window.KIOSK) return; // 두 번 불러와도 한 번만

  /* ───────── 저장소 ───────── */
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 저장 불가 */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* 저장 불가 */ } },
  };
  const qs = new URLSearchParams(location.search);
  if (qs.get("kiosk") === "1") LS.set("kiosk.on", true);
  if (qs.get("kiosk") === "0") { LS.del("kiosk.on"); LS.del("kiosk.session"); }

  const path = () => location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
  const isStart = () => path() === "/kiosk";
  const on = () => (!!LS.get("kiosk.on") || isStart()) && !location.pathname.startsWith("/admin"); // 관리자 페이지는 제외

  /* ───────── 설정 (/kiosk-config.js) ───────── */
  let CFG = window.KIOSK_CONFIG || null;
  const cfgReady = new Promise((resolve) => {
    if (CFG) return resolve(CFG);
    const s = document.createElement("script");
    s.src = "/kiosk-config.js";
    s.onload = () => resolve((CFG = window.KIOSK_CONFIG || {}));
    s.onerror = () => resolve((CFG = {}));
    document.head.appendChild(s);
  });
  const idleMs = () => (CFG?.idleSeconds || 60) * 1000;
  const prize = () => CFG?.prize || "스타벅스 아메리카노";

  /* ───────── 전송 대기열 (인터넷이 끊겨도 보관) ───────── */
  const QKEY = "kiosk.queue";
  const kioskId = LS.get("kiosk.id") || (() => { const id = "k-" + Math.random().toString(36).slice(2, 8); LS.set("kiosk.id", id); return id; })();
  function enqueue(table, row, opts) {
    const q = LS.get(QKEY) || [];
    q.push({ table, row, opts: opts || null });
    if (q.length > 5000) q.splice(0, q.length - 5000);
    LS.set(QKEY, q);
  }
  // 보내는 중인 묶음은 kiosk.inflight 에 적어 둬요. 응답을 확인하면 지우고, 실패하면 대기열로 되돌려요.
  // 보내는 도중 페이지가 바뀌어 확인을 못 하면 15초 뒤 다음 페이지가 다시 보내요 → 기록을 잃지 않아요.
  // (이때 생길 수 있는 중복은 관리자 분석에서 걸러요)
  const IKEY = "kiosk.inflight";
  const RESEND_AFTER = 15000;
  let flushing = false;
  const post = (table, rows, opts) => fetch(`${CFG.supabaseUrl}/rest/v1/${table}${opts?.onConflict ? `?on_conflict=${opts.onConflict}` : ""}`, {
    method: "POST",
    keepalive: true, // 페이지를 옮겨도 브라우저가 끝까지 보내요
    headers: {
      apikey: CFG.supabaseKey, Authorization: `Bearer ${CFG.supabaseKey}`, "Content-Type": "application/json",
      Prefer: "return=minimal" + (opts?.onConflict ? ",resolution=ignore-duplicates" : ""),
    },
    body: JSON.stringify(rows),
  });
  const requeue = (items) => LS.set(QKEY, [...items, ...(LS.get(QKEY) || [])]);
  const settle = (id) => LS.set(IKEY, (LS.get(IKEY) || []).filter((x) => x.id !== id));
  async function flush() {
    if (flushing) return;
    flushing = true; // 기다리기 전에 먼저 켜야 동시에 두 번 보내지 않아요
    try {
      await cfgReady;
      if (!CFG.supabaseUrl || !CFG.supabaseKey || !navigator.onLine) return; // 설정 전엔 브라우저에 쌓아만 둬요
      // 확인 못 한 채 오래된 묶음은 다시 보낼 차례로
      const inflight = LS.get(IKEY) || [];
      const stale = inflight.filter((x) => Date.now() - x.at > RESEND_AFTER);
      if (stale.length) {
        LS.set(IKEY, inflight.filter((x) => !stale.includes(x)));
        requeue(stale.flatMap((x) => x.items));
      }
      const q = LS.get(QKEY) || [];
      if (!q.length) return;
      // 같은 테이블·옵션끼리 묶어서 (순서 유지, keepalive 크기 제한 때문에 최대 40개·약 48KB)
      const head = q[0], batch = [];
      let size = 0;
      for (const it of q) {
        const len = JSON.stringify(it.row).length;
        if (it.table !== head.table || JSON.stringify(it.opts) !== JSON.stringify(head.opts) || batch.length >= 40 || (batch.length && size + len > 48000)) break;
        batch.push(it); size += len;
      }
      const id = Math.random().toString(36).slice(2);
      LS.set(QKEY, q.slice(batch.length));
      LS.set(IKEY, [...(LS.get(IKEY) || []), { id, at: Date.now(), items: batch }]);
      try {
        const res = await post(head.table, batch.map((b) => b.row), head.opts);
        if (res.status >= 500) { settle(id); requeue(batch); return; } // 서버 오류: 다음에 다시
        if (!res.ok && batch.length > 1) {
          // 묶음 안에 문제 있는 행(이미 있는 행 409 포함)이 있으면 하나씩 다시 보내 그 행만 빼고 나머지는 살려요
          for (const it of batch) {
            const r = await post(it.table, [it.row], it.opts);
            if (!r.ok && r.status !== 409) console.warn("[kiosk] 전송 거부", it.table, r.status, await r.text());
          }
        } else if (!res.ok && res.status !== 409) console.warn("[kiosk] 전송 거부", head.table, res.status, await res.text());
        settle(id);
      } catch {
        settle(id); requeue(batch); // 네트워크 오류: 다음에 다시
        return;
      }
      if ((LS.get(QKEY) || []).length) setTimeout(flush, 50);
    } finally { flushing = false; }
  }
  setInterval(flush, 5000);
  addEventListener("online", flush);
  addEventListener("pagehide", () => { flush(); }); // 떠나기 직전 남은 기록을 keepalive 로 보내요

  /* ───────── 세션 · 이벤트 ───────── */
  const now = () => new Date().toISOString();
  const session = () => LS.get("kiosk.session");
  function track(type, data = {}) {
    const s = session();
    if (!s) return;
    if (s.entry === "web") LS.set("kiosk.session", { ...s, lastAt: Date.now() });
    enqueue("events", { session_id: s.id, ts: now(), type, page: data.page ?? path(), target: data.target ?? null, duration_ms: data.duration_ms ?? null, meta: data.meta ?? null });
  }
  function startSession(entry) {
    const cur = session();
    if (cur && entry !== "web" && cur.entry !== "web") { track("home_pick", { page: "/kiosk", target: entry }); flush(); return cur; } // 같은 손님이 첫 화면에서 다시 고름
    endSession("restart");
    const uuid = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); });
    const s = { id: uuid, startedAt: Date.now(), entry };
    LS.set("kiosk.session", s);
    LS.del("kiosk.survey");
    LS.del("curator.notiSeen"); // 새 손님에게는 최근 소식이 다시 NEW로 보이게 (AI 소식 알림함 읽음 기록)
    enqueue("sessions", { id: s.id, started_at: now(), entry, kiosk_id: entry === "web" ? "web" : kioskId, screen_w: screen.width, screen_h: screen.height, user_agent: navigator.userAgent.slice(0, 200) });
    track("session_start", { page: "/kiosk", target: entry });
    flush();
    return s;
  }
  function endSession(reason) {
    const s = session();
    if (!s) return;
    leavePage();
    saveSurvey(false);
    track("session_end", { target: reason, duration_ms: Date.now() - s.startedAt });
    LS.del("kiosk.session");
    LS.del("kiosk.survey");
    flush();
  }

  // 페이지 머문 시간: 들어올 때 page_view, 나갈 때 page_leave(머문 ms)
  let curPage = null, curSince = 0;
  function enterPage() {
    if (!session() || isStart()) return;
    curPage = path(); curSince = Date.now();
    track("page_view", { page: curPage, meta: { title: document.title.slice(0, 80) } });
  }
  function leavePage() {
    if (!curPage) return;
    track("page_leave", { page: curPage, duration_ms: Date.now() - curSince });
    curPage = null;
  }
  function onRoute() { if (curPage !== path()) { leavePage(); enterPage(); } }
  for (const m of ["pushState", "replaceState"]) {
    const orig = history[m];
    history[m] = function (...a) { const r = orig.apply(this, a); setTimeout(onRoute, 0); return r; };
  }
  addEventListener("popstate", onRoute);
  addEventListener("pagehide", () => { leavePage(); });

  // 클릭: 무엇을 눌렀는지 (위젯 자신은 따로 기록)
  function describe(el) {
    const t = el.closest("[data-track],a,button,[role=button],[role=option],input,label,.row,.news,.react-flow__node,.cat,.tl-item");
    if (!t) return null;
    const label = t.dataset?.track || t.getAttribute("aria-label") || (t.innerText || t.value || "").trim().replace(/\s+/g, " ").slice(0, 60) || t.tagName.toLowerCase();
    const kind = t.classList.contains("react-flow__node") ? "map-node" : t.tagName.toLowerCase();
    return { label, kind };
  }
  document.addEventListener("click", (e) => {
    if (!session() || e.target.closest?.(".kq-root")) return;
    const d = describe(e.target);
    track("click", { target: d ? d.label : "(빈 곳)", meta: { kind: d?.kind || "none", x: +(e.clientX / innerWidth).toFixed(3), y: +(e.clientY / innerHeight).toFixed(3) } });
  }, true);

  window.KIOSK = { startSession, endSession, track, flush, session, enabled: on };
  // 키오스크 밖 방문: 기록만 하고 끝 (관리자 페이지는 제외)
  const WEB_GAP = 30 * 60e3;
  if (!on()) {
    if (location.pathname.startsWith("/admin")) return;
    const s = session();
    if (!s || s.entry !== "web" || Date.now() - (s.lastAt || s.startedAt) > WEB_GAP) { LS.del("kiosk.session"); startSession("web"); }
    enterPage();
    return;
  }
  if (session()?.entry === "web") LS.del("kiosk.session"); // 같은 브라우저에서 키오스크 모드를 켜면 새 세션으로
  // ── 여기부터는 키오스크 모드에서만 ──

  document.documentElement.classList.add("kiosk");
  const css = document.createElement("link");
  css.rel = "stylesheet"; css.href = "/kiosk/kiosk.css";
  document.head.appendChild(css);
  flush();

  /* ───────── 터치 보정 ───────── */
  // 누른 자리에 작은 물결 (터치가 들어오는지 눈으로 확인)
  addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const r = document.createElement("span");
    r.className = "kq-ripple";
    r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }, { capture: true, passive: true });
  // 일부 파이 화면(Wayland)에서는 탭이 click 으로 이어지지 않아요 → 짧은 탭 뒤 click 이 안 오면 직접 눌러 줘요
  let tap = null, clicked = 0;
  addEventListener("click", () => { clicked = Date.now(); }, true);
  addEventListener("pointerdown", (e) => {
    tap = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY, t: Date.now(), el: e.target };
  }, { capture: true, passive: true });
  addEventListener("pointerup", (e) => {
    const t = tap; tap = null;
    if (!t || Date.now() - t.t > 600 || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) return;
    const since = Date.now();
    setTimeout(() => {
      if (clicked >= since - 50) return; // 정상적으로 click 이 왔어요
      const el = t.el?.closest?.("button, a[href], [role=button], input, label, summary, .kq-warn, .react-flow__node");
      if (el && el.isConnected) el.click();
    }, 350);
  }, { capture: true, passive: true });
  // 터치가 마우스로 들어오는 화면(XWayland 등)에서도 손가락으로 끌어서 스크롤 (마인드맵은 자체 이동)
  const canScroll = (el, dx, dy) => {
    const cs = getComputedStyle(el);
    const y = /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
    const x = /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
    return Math.abs(dy) >= Math.abs(dx) ? y : x;
  };
  let drag = null, eatClick = false;
  addEventListener("pointerdown", (e) => {
    drag = null;
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest?.(".react-flow, .kq-kb")) return;
    drag = { x: e.clientX, y: e.clientY, el: e.target, sc: null, moved: false };
  }, true);
  addEventListener("pointermove", (e) => {
    if (!drag || !(e.buttons & 1)) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 8) return;
      drag.moved = true;
      let el = drag.el;
      while (el && el !== document.body && !(el instanceof Element && canScroll(el, dx, dy))) el = el.parentElement;
      drag.sc = el && el !== document.body ? el : document.scrollingElement;
    }
    drag.sc.scrollBy(-dx, -dy);
    drag.x = e.clientX; drag.y = e.clientY;
    e.preventDefault();
  }, true);
  addEventListener("pointerup", () => { if (drag?.moved) { eatClick = true; setTimeout(() => { eatClick = false; }, 0); } drag = null; }, true);
  addEventListener("click", (e) => { if (eatClick) { eatClick = false; e.preventDefault(); e.stopPropagation(); } }, true);
  addEventListener("dragstart", (e) => e.preventDefault(), true); // 링크·이미지가 끌려가지 않게

  /* ───────── 무반응 시간 (세션은 아무것도 안 누를 때만 끝나요) ───────── */
  let last = Date.now();
  // 터치가 있으면 시간만 초기화. 페이지를 옮겨도 이어지게 세션에도 마지막 터치 시각을 남겨요
  const poke = () => {
    last = Date.now();
    const s = session();
    if (s && last - (s.lastAt || 0) > 5000) LS.set("kiosk.session", { ...s, lastAt: last });
  };
  for (const ev of ["pointerdown", "touchstart", "keydown", "wheel"]) addEventListener(ev, poke, { capture: true, passive: true });
  addEventListener("scroll", poke, { capture: true, passive: true });
  const stale = () => { const s = session(); return !!s && Date.now() - (s.lastAt || s.startedAt) >= idleMs(); };

  // 첫 화면은 React 페이지가 직접 그려요. 돌아와도 세션은 이어지고, 무반응이면 그때 끝나요
  if (isStart()) {
    cfgReady.then(() => { if (stale()) endSession("idle"); });
    setInterval(() => { if (session() && Date.now() - last >= idleMs()) endSession("idle"); }, 1000);
    return;
  }

  if (stale()) endSession("idle"); // 오래 꺼져 있다가 켜진 경우
  if (!session()) startSession("direct"); // 첫 화면을 거치지 않고 들어온 경우
  enterPage();

  /* ───────── 화면 요소 ───────── */
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 아이콘은 SVG 로 (파이에는 컬러 이모지 글꼴이 없을 수 있어요)
  const ICON = {
    cup: `<svg class="kq-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 2.5c-.8 1 .8 2-0 3M12 2.5c-.8 1 .8 2 0 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    party: `<svg class="kq-ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 42 18 14l16 16L8 42Z" fill="#FF2E88"/><path d="M8 42 13 28l7 7-12 7Z" fill="#00F0FF"/><circle cx="34" cy="9" r="3" fill="#C6FF00"/><circle cx="41" cy="20" r="2.4" fill="#00F0FF"/><circle cx="25" cy="6" r="2" fill="#FF6B00"/><path d="M27 18c3-5 8-6 12-4M30 24c4-2 8-1 11 2" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  };
  // 5단계 표정 (0 = 별로 ~ 4 = 아주 좋음)
  const face = (i) => {
    const mouth = ["M8 17q4-4 8 0", "M8.5 16.5q3.5-2 7 0", "M8.5 16h7", "M8.5 15.5q3.5 2 7 0", "M7.5 14.5q4.5 5 9 0"][i];
    const eyes = i === 4 ? `<path d="M7.5 10q1.5-2 3 0M13.5 10q1.5-2 3 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>` : `<circle cx="9" cy="10" r="1.3" fill="currentColor"/><circle cx="15" cy="10" r="1.3" fill="currentColor"/>`;
    return `<svg class="kq-face" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>${eyes}<path d="${mouth}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  };
  const root = h(`<div class="kq-root" aria-live="polite"></div>`);
  const mount = () => document.body ? document.body.appendChild(root) : addEventListener("DOMContentLoaded", () => document.body.appendChild(root));
  mount();

  // 아래 가운데 고정 버튼: 처음으로 · 설문 참여 (마인드맵 조작 영역을 막지 않게 작게)
  const dock = h(`<div class="kq-dock">
      <button type="button" class="kq-dock-home" aria-label="처음 화면으로">⌂ 처음으로</button>
      <button type="button" class="kq-dock-survey">${ICON.cup}<b>설문 참여</b><small>1분 · 커피 추첨</small></button>
    </div>`);
  root.appendChild(dock);
  dock.querySelector(".kq-dock-home").onclick = () => goHome("home");
  dock.querySelector(".kq-dock-survey").onclick = () => openSurvey();
  function refreshDock() {
    const done = LS.get("kiosk.survey")?.completed;
    dock.classList.toggle("done", !!done);
    dock.querySelector(".kq-dock-survey b").textContent = done ? "설문 완료 ✓" : "설문 참여";
    dock.querySelector(".kq-dock-survey small").textContent = done ? "고마워요" : "1분 · 커피 추첨";
  }
  refreshDock();

  // 설문 버튼 위로 말풍선: 12초마다 6초씩 (설문 중이거나 끝냈으면 안 보여요)
  const call = h(`<button type="button" class="kq-call">${ICON.cup}<span></span></button>`);
  root.appendChild(call);
  call.onclick = () => { call.classList.remove("show"); openSurvey(); };
  cfgReady.then(() => { call.querySelector("span").innerHTML = `<b>1분</b>이면 끝! 설문하고 <b>${esc(prize())}</b> 받아 가세요`; });
  // 툴 패널·모델 상세·알림함·설문·마인드맵 안내가 떠 있으면 가리지 않게 쉬어요
  const busy = () => !!(root.querySelector(".kq-ov") || document.querySelector("[data-map-hint], [data-tool-panel], #dim:not([hidden]), #noti:not([hidden])"));
  const showCall = () => {
    if (LS.get("kiosk.survey")?.completed || busy()) return;
    call.classList.add("show");
    setTimeout(() => call.classList.remove("show"), 6000);
  };
  setTimeout(showCall, 2500);
  setInterval(showCall, 12000);
  setInterval(() => { if (busy()) call.classList.remove("show"); }, 300); // 떠 있는 중에 창이 열리면 바로 숨김

  function goHome(reason) {
    if (reason === "idle") endSession("idle");
    else { track("go_home", { target: reason }); flush(); } // 처음으로·나가기: 같은 손님이니 세션은 이어가요
    location.href = "/kiosk";
  }
  window.KIOSK.goHome = goHome; // 페이지 안 "나가기" 버튼에서도 써요
  addEventListener("click", (e) => { if (e.target.closest?.("[data-kiosk-exit]")) goHome("exit"); }); // AI 소식 화면 나가기

  /* ───────── 무반응(기본 1분) → 세션 끝, 첫 화면 ───────── */
  let warnEl = null;
  // 안내창은 직접 눌러서 닫아요 (누른 터치가 아래 버튼으로 새지 않게)
  const closeWarn = (e) => { e.preventDefault(); e.stopPropagation(); poke(); if (warnEl) { warnEl.remove(); warnEl = null; } };
  setInterval(() => {
    const idle = Date.now() - last, left = Math.ceil((idleMs() - idle) / 1000);
    if (idle >= idleMs()) return goHome("idle");
    if (left <= 10 || warnEl) {
      if (!warnEl) {
        warnEl = h(`<div class="kq-warn"><div class="kq-warn-card"><div class="kq-ring"><b></b></div><p>곧 처음 화면으로 돌아가요</p><button type="button" class="kq-primary kq-stay">계속 보기</button></div></div>`);
        warnEl.addEventListener("click", closeWarn);
        root.appendChild(warnEl);
      }
      warnEl.querySelector("b").textContent = Math.min(left, 10);
    }
  }, 500);

  /* ───────── 설문 문항 (면담지 13문항 + 마무리 1문항) ───────── */
  // 설문 문항은 questions.json 한 곳에서 관리해요 (관리자 분석 페이지와 공유)
  let QUESTIONS = [], byId = {};
  const questionsReady = fetch("/kiosk/questions.json").then((r) => r.json()).then((d) => {
    QUESTIONS = d.questions; byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  }).catch(() => {});
  const nextOf = (q, v) => (v != null && q.branch?.[v]) || q.next || (q.end ? "end" : QUESTIONS[QUESTIONS.indexOf(q) + 1]?.id || "end");

  // 진행 상태는 세션 안에서 유지 (닫았다 다시 열면 이어서)
  const S = () => LS.get("kiosk.survey") || { step: "intro", path: [], answers: {}, details: {}, completed: false, saved: false, openedOn: null, startedAt: null };
  const saveState = (st) => LS.set("kiosk.survey", st);

  function saveSurvey(completed) {
    const st = LS.get("kiosk.survey"), s = session();
    if (!st || !s || st.saved || !st.startedAt) return;
    enqueue("survey_responses", {
      session_id: s.id, opened_on: st.openedOn, started_at: new Date(st.startedAt).toISOString(), finished_at: now(),
      completed, last_question: st.path.at(-1) || null, answers: st.answers, details: st.details, kiosk_id: kioskId,
    });
    st.saved = true; saveState(st);
  }

  /* ───────── 설문 화면 ───────── */
  let ov = null;
  async function openSurvey() {
    await questionsReady;
    if (!QUESTIONS.length || ov) return;
    const st = S();
    if (!st.openedOn) { st.openedOn = path(); saveState(st); }
    track("survey_open", { target: st.completed ? "after-complete" : st.step });
    ov = h(`<div class="kq-ov" role="dialog" aria-modal="true" aria-label="설문조사"><div class="kq-card"></div></div>`);
    root.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("in"));
    render(st.completed ? "done" : st.step, 0);
  }
  function closeSurvey() {
    if (!ov) return;
    track("survey_close", { target: S().step });
    closeKeyboard();
    ov.classList.remove("in");
    const o = ov; ov = null;
    setTimeout(() => o.remove(), 250);
    refreshDock();
  }

  const card = () => ov.querySelector(".kq-card");
  function render(step, dir) {
    const st = S(); st.step = step; saveState(st);
    const c = card();
    c.classList.remove("slide-l", "slide-r"); void c.offsetWidth;
    if (dir) c.classList.add(dir > 0 ? "slide-l" : "slide-r");
    if (step === "intro") return renderIntro(c);
    if (step === "done") return renderDone(c);
    if (step === "raffle") return renderRaffle(c);
    if (step === "thanks") return renderThanks(c);
    renderQuestion(c, byId[step]);
  }

  function renderIntro(c) {
    c.innerHTML = `
      <button type="button" class="kq-x" aria-label="닫기">✕</button>
      <div class="kq-intro">
        <div class="kq-badge">AI 이용 설문</div>
        <h2>총 <em>${QUESTIONS.length}문항</em>, <em>1분</em>이면 끝나요</h2>
        <p class="kq-prize">${ICON.cup} 완료하면 추첨을 통해 <b>${esc(prize())}</b>를 드려요</p>
        <ul class="kq-points"><li>버튼만 누르면 돼요 · 모르면 건너뛰어도 OK</li><li>응답은 이름·연락처 없이 익명으로 저장돼요</li></ul>
        <button type="button" class="kq-primary kq-start">동의하고 시작하기 →</button>
        <small>응답과 이 화면 이용 기록(누른 버튼·머문 시간)은 서비스 개선을 위한 통계로만 써요.</small>
      </div>`;
    c.querySelector(".kq-x").onclick = closeSurvey;
    c.querySelector(".kq-start").onclick = (e) => {
      burst(e.currentTarget, 14);
      const st = S(); st.startedAt = st.startedAt || Date.now(); st.consent = true; saveState(st);
      track("survey_start");
      setTimeout(() => render("q1", 1), 260);
    };
  }

  function renderQuestion(c, q) {
    const st = S();
    const val = st.answers[q.id];
    const sel = new Set(Array.isArray(val) ? val : val != null ? [val] : []);
    const opts = q.extra ? [...q.options, q.extra] : q.options;
    const scale = q.type === "scale";
    c.innerHTML = `
      <div class="kq-top">
        <div class="kq-prog"><i style="width:${(q.no / QUESTIONS.length) * 100}%"></i></div>
        <span class="kq-count"><b>${q.no}</b> / ${QUESTIONS.length}</span>
        <button type="button" class="kq-x" aria-label="닫기">✕</button>
      </div>
      <div class="kq-body">
        <div class="kq-sec">${esc(q.sec)}${q.type === "multi" ? ` · 여러 개 선택${q.max ? ` (최대 ${q.max}개)` : ""}` : ""}</div>
        <h3 class="kq-q">${esc(q.title)}</h3>
        <div class="kq-opts ${scale ? "scale" : ""} n${opts.length}">
          ${opts.map((o, i) => `<button type="button" class="kq-opt ${sel.has(o) ? "on" : ""} ${scale && i < q.options.length ? "lv" + i : ""} ${o === q.extra ? "extra" : ""}" data-v="${esc(o)}">
            ${scale && o !== q.extra ? face(i) : ""}<span>${esc(o)}</span></button>`).join("")}
        </div>
        <button type="button" class="kq-detail ${st.details[q.id] ? "has" : ""}"><span>✎</span><span class="kq-detail-text">${st.details[q.id] ? esc(st.details[q.id]) : "자세히 쓰기 (선택)"}</span></button>
      </div>
      <div class="kq-foot">
        <button type="button" class="kq-ghost kq-prev" ${st.path.length ? "" : "disabled"}>← 이전</button>
        <button type="button" class="kq-primary kq-next"></button>
      </div>`;
    const nextBtn = c.querySelector(".kq-next");
    const syncNext = () => {
      const has = sel.size > 0 || !!S().details[q.id];
      nextBtn.textContent = has ? "다음 →" : "건너뛰기 →";
      nextBtn.classList.toggle("ready", sel.size > 0);
    };
    syncNext();
    c.querySelector(".kq-x").onclick = closeSurvey;
    c.querySelectorAll(".kq-opt").forEach((b) => (b.onclick = () => {
      const v = b.dataset.v;
      if (q.type === "multi") {
        if (sel.has(v)) sel.delete(v);
        else {
          if (q.max && sel.size >= q.max) { b.classList.add("nope"); setTimeout(() => b.classList.remove("nope"), 400); return; }
          sel.add(v);
        }
      } else { sel.clear(); sel.add(v); }
      c.querySelectorAll(".kq-opt").forEach((x) => x.classList.toggle("on", sel.has(x.dataset.v)));
      if (sel.has(v)) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); burst(b, 10); }
      const s2 = S(); s2.answers[q.id] = q.type === "multi" ? [...sel] : sel.size ? [...sel][0] : null; saveState(s2);
      syncNext();
    }));
    c.querySelector(".kq-detail").onclick = () => openKeyboard(S().details[q.id] || "", (text) => {
      const s2 = S(); if (text) s2.details[q.id] = text; else delete s2.details[q.id]; saveState(s2);
      const d = c.querySelector(".kq-detail");
      d.classList.toggle("has", !!text);
      d.querySelector(".kq-detail-text").textContent = text || "자세히 쓰기 (선택)";
      syncNext();
    }, q.title);
    c.querySelector(".kq-prev").onclick = () => {
      const s2 = S(); const prev = s2.path.pop(); saveState(s2);
      if (prev) render(prev, -1);
    };
    nextBtn.onclick = () => {
      const s2 = S(); const v = s2.answers[q.id] ?? null;
      track("survey_answer", { target: q.id, meta: { value: v, detail: !!s2.details[q.id] } });
      s2.path.push(q.id); saveState(s2);
      const nx = nextOf(q, v);
      if (nx === "end") return finish();
      render(nx, 1);
    };
  }

  function finish() {
    const st = S(); st.completed = true; saveState(st);
    track("survey_complete", { duration_ms: Date.now() - (st.startedAt || Date.now()) });
    saveSurvey(true);
    flush();
    render("done", 1);
    confetti();
  }

  function renderDone(c) {
    c.innerHTML = `
      <button type="button" class="kq-x" aria-label="닫기">✕</button>
      <div class="kq-intro">
        <div class="kq-big">${ICON.party}</div>
        <h2>설문 완료! <em>고마워요</em></h2>
        <p class="kq-prize">${ICON.cup} <b>${esc(prize())}</b> 추첨에 응모할래요?</p>
        <div class="kq-row">
          <button type="button" class="kq-primary kq-go">응모하기</button>
          <button type="button" class="kq-ghost kq-skip">괜찮아요</button>
        </div>
        <small>응모는 선택이에요. 연락처는 설문 답변과 연결하지 않고 따로 보관해요.</small>
      </div>`;
    c.querySelector(".kq-x").onclick = closeSurvey;
    c.querySelector(".kq-skip").onclick = () => { track("raffle_skip"); closeSurvey(); };
    c.querySelector(".kq-go").onclick = () => render("raffle", 1);
  }

  function renderRaffle(c) {
    let digits = "010";
    c.innerHTML = `
      <div class="kq-top"><span class="kq-count">${ICON.cup} 추첨 응모</span><button type="button" class="kq-x" aria-label="닫기">✕</button></div>
      <div class="kq-raffle">
        <div class="kq-consent">
          <b>개인정보 수집·이용 동의</b>
          <p>항목: 휴대폰 번호 · 목적: 경품 추첨 및 발송 · 보관: 발송 후 즉시 파기<br>동의하지 않으면 응모할 수 없어요 (설문 참여에는 영향 없음).</p>
          <button type="button" class="kq-check" aria-pressed="false"><i></i>동의합니다</button>
        </div>
        <div class="kq-pad-wrap">
          <div class="kq-phone" aria-live="polite"></div>
          <div class="kq-pad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", "지움", "0", "⌫"].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join("")}</div>
          <button type="button" class="kq-primary kq-submit" disabled>응모하기</button>
          <p class="kq-err" hidden></p>
        </div>
      </div>`;
    const phoneEl = c.querySelector(".kq-phone"), submit = c.querySelector(".kq-submit"), check = c.querySelector(".kq-check");
    const fmt = (d) => d.replace(/^(\d{3})(\d{0,4})(\d{0,4}).*$/, (_, a, b, cc) => [a, b, cc].filter(Boolean).join("-"));
    const sync = () => {
      phoneEl.innerHTML = esc(fmt(digits)) + `<span class="kq-caret"></span>` + `<span class="kq-ph">${"0".repeat(Math.max(0, 11 - digits.length)).replace(/0/g, "·")}</span>`;
      submit.disabled = !(check.getAttribute("aria-pressed") === "true" && /^01[016789]\d{7,8}$/.test(digits));
    };
    sync();
    c.querySelector(".kq-x").onclick = closeSurvey;
    check.onclick = () => { const v = check.getAttribute("aria-pressed") !== "true"; check.setAttribute("aria-pressed", v); if (v) burst(check, 8); sync(); };
    c.querySelectorAll(".kq-pad button").forEach((b) => (b.onclick = () => {
      const k = b.dataset.k;
      if (k === "⌫") digits = digits.slice(0, -1);
      else if (k === "지움") digits = "";
      else if (digits.length < 11) digits += k;
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
      sync();
    }));
    submit.onclick = () => {
      // 연락처는 세션과 연결하지 않아요 (설문 익명 유지). 같은 번호는 한 번만 저장
      enqueue("raffle_entries", { phone: digits, consented_at: now(), kiosk_id: kioskId }, { onConflict: "phone" });
      track("raffle_enter");
      flush();
      confetti();
      render("thanks", 1);
    };
  }

  function renderThanks(c) {
    c.innerHTML = `
      <div class="kq-intro">
        <div class="kq-big kq-cup">${ICON.cup}</div>
        <h2>응모 완료! <em>행운을 빌어요</em></h2>
        <p>당첨되면 입력한 번호로 연락드릴게요.</p>
        <button type="button" class="kq-primary kq-close">계속 둘러보기</button>
      </div>`;
    c.querySelector(".kq-close").onclick = closeSurvey;
  }

  /* ───────── 재미있는 반응: 반짝 터짐 · 색종이 ───────── */
  const COLORS = ["#00F0FF", "#FF2E88", "#C6FF00", "#FF6B00", "#FFFFFF"];
  function burst(el, n) {
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "kq-spark";
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5, d = 40 + Math.random() * 50;
      p.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${COLORS[i % COLORS.length]}`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }
  function confetti() {
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("i");
      p.className = "kq-confetti";
      p.style.cssText = `left:${Math.random() * 100}vw;background:${COLORS[i % COLORS.length]};--r:${Math.random() * 720 - 360}deg;--x:${Math.random() * 160 - 80}px;animation-delay:${Math.random() * 0.3}s;animation-duration:${1.6 + Math.random()}s`;
      root.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }

  /* ───────── 화면 한글 키보드 (파이 터치 화면엔 키보드가 없어요) ───────── */
  let kb = null;
  let hangulReady = null;
  const loadHangul = () => hangulReady || (hangulReady = new Promise((res) => {
    if (window.Hangul) return res();
    const s = document.createElement("script"); s.src = "/kiosk/vendor/hangul.min.js"; s.onload = res; s.onerror = res;
    document.head.appendChild(s);
  }));
  const LAYOUT = {
    ko: [["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"], ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"], ["⇧", "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "⌫"]],
    koS: [["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ", "ㅛ", "ㅕ", "ㅑ", "ㅒ", "ㅖ"], ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"], ["⇧", "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "⌫"]],
    en: [["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"], ["a", "s", "d", "f", "g", "h", "j", "k", "l"], ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"]],
    enS: [["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"]],
    num: [["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], ["-", "/", ":", "(", ")", "₩", "%", "~", "\""], ["!", "?", ",", ".", "'", "+", "=", "@", "⌫"]],
  };
  async function openKeyboard(initial, onDone, label) {
    await loadHangul();
    closeKeyboard();
    let jamo = window.Hangul ? window.Hangul.disassemble(initial) : initial.split("");
    let mode = "ko", shift = false;
    const text = () => (window.Hangul ? window.Hangul.assemble(jamo) : jamo.join(""));
    kb = h(`<div class="kq-kb" role="dialog" aria-label="입력 키보드">
        <div class="kq-kb-head"><span class="kq-kb-label"></span><button type="button" class="kq-kb-done">완료</button></div>
        <div class="kq-kb-field"><span class="kq-kb-text"></span><span class="kq-caret"></span></div>
        <div class="kq-kb-keys"></div>
      </div>`);
    kb.querySelector(".kq-kb-label").textContent = label;
    root.appendChild(kb);
    requestAnimationFrame(() => kb.classList.add("in"));
    const draw = () => {
      kb.querySelector(".kq-kb-text").textContent = text();
      const rows = LAYOUT[mode === "num" ? "num" : mode + (shift ? "S" : "")];
      kb.querySelector(".kq-kb-keys").innerHTML = rows.map((r) => `<div class="kq-kb-row">${r.map((k) =>
        `<button type="button" class="${k === "⇧" ? "fn" + (shift ? " on" : "") : k === "⌫" ? "fn" : ""}" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div>`).join("") +
        `<div class="kq-kb-row last"><button type="button" class="fn" data-k="mode-num">${mode === "num" ? "한/영" : "123"}</button>
          <button type="button" class="fn" data-k="mode-lang">${mode === "en" ? "한글" : "ABC"}</button>
          <button type="button" class="space" data-k=" ">띄어쓰기</button>
          <button type="button" class="fn" data-k=".">.</button>
          <button type="button" class="fn go" data-k="done">완료</button></div>`;
    };
    draw();
    const finish = () => { const t = text().trim().slice(0, 300); closeKeyboard(); onDone(t); };
    kb.querySelector(".kq-kb-done").onclick = finish;
    kb.querySelector(".kq-kb-keys").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const k = b.dataset.k;
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
      if (k === "done") return finish();
      if (k === "⌫") jamo.pop();
      else if (k === "⇧") shift = !shift;
      else if (k === "mode-num") { mode = mode === "num" ? "ko" : "num"; shift = false; }
      else if (k === "mode-lang") { mode = mode === "en" ? "ko" : "en"; shift = false; }
      else if (jamo.length < 600) { jamo.push(k); if (shift && mode !== "num") shift = false; }
      draw();
    });
  }
  function closeKeyboard() {
    if (!kb) return;
    const k = kb; kb = null;
    k.classList.remove("in");
    setTimeout(() => k.remove(), 220);
  }
})();
