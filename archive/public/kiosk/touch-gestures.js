/*
 * 키오스크 터치: 손가락으로 끌어서 스크롤 + 확대·축소
 *  - 파이에 따라 터치가 '마우스'로 들어오면 끌어도 스크롤이 안 돼요. 그때도 끌면 스크롤되게 해요.
 *  - 두 손가락으로 벌리면 화면(#app)을 키워요. 글자가 커지고 줄이 다시 맞춰져서 옆으로 넘치지 않아요.
 *    (파이 브라우저는 페이지 전체 확대를 꺼 두었어요. 터치가 마우스로 들어오면 두 손가락을 못 써서 오른쪽 +/− 버튼도 둬요)
 */
(() => {
  "use strict";
  if (window.TouchGestures) return;

  /* ───────── 확대·축소 ───────── */
  const MIN = 1, MAX = 1.8, STEP = 0.2;
  let zoom = 1;
  const app = () => document.getElementById("app");
  const setZoom = (z) => {
    zoom = Math.min(MAX, Math.max(MIN, Math.round(z * 100) / 100));
    const el = app(); if (el) el.style.zoom = zoom === 1 ? "" : String(zoom);
    document.body.classList.toggle("tg-z", zoom > 1);
    fitMedia(innerWidth / zoom);
    if (out) { out.disabled = zoom <= MIN; inn.disabled = zoom >= MAX; }
  };

  // 확대하면 실제로 쓸 수 있는 폭이 좁아져요. 그런데 화면 크기 기준(@media)은 진짜 화면 폭을 봐요.
  // 그래서 페이지에 있는 "(max-width: Npx)" 규칙 가운데 확대한 폭에 맞는 것을 켜고, "(min-width: Npx)" 는 꺼요.
  // 규칙 순서는 그대로라서 좁은 화면에서 보는 것과 같은 배치가 돼요. 원래 크기로 돌아오면 원래대로 되돌려요.
  const orig = new Map();
  const mediaRules = () => {
    const out = [];
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch { continue; } // 다른 사이트 글꼴 CSS 는 못 읽어요
      for (const r of rules) if (r instanceof CSSMediaRule) out.push(r);
    }
    return out;
  };
  const fitMedia = (w) => {
    for (const r of mediaRules()) {
      if (!orig.has(r)) orig.set(r, r.media.mediaText);
      const text = orig.get(r);
      const m = /^\(\s*(max|min)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)$/.exec(text.trim());
      if (!m) continue; // 폭 하나만 보는 규칙만 다뤄요
      const n = +m[2], real = innerWidth;
      let next = text;
      if (w < real) {
        if (m[1] === "max" && n < real && w <= n) next = "all";      // 확대한 폭이면 켜져야 하는 좁은 화면 규칙
        if (m[1] === "min" && n <= real && w < n) next = "not all";  // 확대한 폭이면 꺼져야 하는 넓은 화면 규칙
      }
      if (r.media.mediaText !== next) r.media.mediaText = next;
    }
  };
  addEventListener("resize", () => fitMedia(innerWidth / zoom));

  const style = document.createElement("style");
  style.textContent = `
html,html *{cursor:none!important} /* 터치 전용: 마우스 화살표 숨김 (예전 키오스크와 같게) */
.tg-zoom{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:900;display:flex;flex-direction:column;gap:6px;opacity:.6}
.tg-zoom:active{opacity:1}
.tg-zoom button{width:34px;height:44px;border-right:0!important;border-radius:12px 0 0 12px!important;border-radius:12px;border:1px solid #545a63;background:rgba(27,30,35,.9);color:#d9dde3;font:700 22px/1 system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
.tg-zoom button:disabled{opacity:.35}
.tg-zoom button:active{background:#2f514c}
body.tkb-open .tg-zoom{display:none}`;
  document.head.appendChild(style);
  const box = document.createElement("div");
  box.className = "tg-zoom";
  box.innerHTML = `<button type="button" aria-label="크게 보기">+</button><button type="button" aria-label="작게 보기">−</button>`;
  const [inn, out] = box.querySelectorAll("button");
  inn.onclick = () => setZoom(zoom + STEP);
  out.onclick = () => setZoom(zoom - STEP);
  const mount = () => { document.body.appendChild(box); setZoom(zoom); };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  // 두 손가락 벌리기·오므리기 (터치가 진짜 터치로 들어올 때)
  let pinch = null;
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) pinch = { d: dist(e.touches), z: zoom };
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    setZoom(pinch.z * dist(e.touches) / pinch.d);
  }, { passive: false });
  document.addEventListener("touchend", (e) => { if (e.touches.length < 2) pinch = null; }, { passive: true });

  /* ───────── 탭 보정 ───────── */
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
      const el = t.el?.closest?.("button, a[href], [role=button], [data-a], [data-act], [data-go], input, textarea, label, summary");
      if (el && el.isConnected) el.click();
    }, 350);
  }, { capture: true, passive: true });

  /* ───────── 끌어서 스크롤 (터치가 마우스로 들어오는 화면) ───────── */
  const canScroll = (el, dx, dy) => {
    const cs = getComputedStyle(el);
    const y = /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
    const x = /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
    return Math.abs(dy) >= Math.abs(dx) ? y : x;
  };
  let drag = null, eatUntil = 0, fling = 0;
  addEventListener("pointerdown", (e) => {
    drag = null;
    cancelAnimationFrame(fling); fling = 0; // 미끄러지는 중에 다시 짚으면 멈춰요
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest?.(".tkb, .tg-zoom, input, textarea")) return;
    drag = { x: e.clientX, y: e.clientY, el: e.target, sc: null, moved: false, pts: [] };
  }, true);
  addEventListener("pointermove", (e) => {
    if (!drag || !(e.buttons & 1)) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 12) return; // 손가락 떨림은 탭으로 봐요
      drag.moved = true;
      let el = drag.el;
      while (el && el !== document.body && !(el instanceof Element && canScroll(el, dx, dy))) el = el.parentElement;
      drag.sc = el && el !== document.body ? el : document.scrollingElement;
      getSelection()?.removeAllRanges();
    }
    drag.sc.scrollBy(-dx, -dy);
    drag.x = e.clientX; drag.y = e.clientY;
    drag.pts.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (drag.pts.length > 8) drag.pts.shift();
    e.preventDefault();
  }, true);
  // 손을 떼면 마지막 0.1초 동안 끈 속도로 계속 미끄러지다가 천천히 멈춰요 (휴대폰처럼)
  const startFling = (sc, pts, now) => {
    const recent = pts.filter((p) => now - p.t < 100);
    if (recent.length < 2) return;
    const a = recent[0], b = recent[recent.length - 1], dt = Math.max(b.t - a.t, 8);
    let vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt; // px/ms
    let last = performance.now();
    const step = (t) => {
      const ms = Math.min(t - last, 40); last = t;
      sc.scrollBy(-vx * ms, -vy * ms);
      const k = Math.pow(0.95, ms / 16);
      vx *= k; vy *= k;
      fling = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
    };
    fling = requestAnimationFrame(step);
  };
  // 끌고 난 뒤 손을 뗄 때 그 자리 버튼이 눌리지 않게 (클릭이 늦게 와도 0.4초 동안 막아요)
  addEventListener("pointerup", (e) => {
    if (drag?.moved) { eatUntil = e.timeStamp + 400; startFling(drag.sc, drag.pts, e.timeStamp); }
    drag = null;
  }, true);
  addEventListener("click", (e) => { if (e.timeStamp < eatUntil) { eatUntil = 0; e.preventDefault(); e.stopPropagation(); } }, true);
  addEventListener("dragstart", (e) => e.preventDefault(), true); // 링크·이미지가 끌려가지 않게
  addEventListener("selectstart", (e) => { if (drag?.moved) e.preventDefault(); }, true);

  window.TouchGestures = { setZoom };
})();
