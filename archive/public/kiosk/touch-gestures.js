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
    if (out) { out.disabled = zoom <= MIN; inn.disabled = zoom >= MAX; }
  };

  const style = document.createElement("style");
  style.textContent = `
.tg-zoom{position:fixed;right:8px;top:50%;transform:translateY(-50%);z-index:900;display:flex;flex-direction:column;gap:6px}
.tg-zoom button{width:44px;height:44px;border-radius:12px;border:1px solid #545a63;background:rgba(27,30,35,.88);color:#d9dde3;font:700 22px/1 system-ui,sans-serif;cursor:pointer;touch-action:manipulation}
.tg-zoom button:disabled{opacity:.35}
.tg-zoom button:active{background:#2f514c}
body.tkb-open .tg-zoom{display:none}
/* 확대하면 실제로 쓸 수 있는 폭이 좁아져요. 화면 크기 기준(@media)은 그대로라서, 이 페이지의 좁은 화면용 배치를 직접 켜요 */
.tg-z .presets,.tg-z .grid2,.tg-z .examples,.tg-z .guide ol{grid-template-columns:1fr}
.tg-z .two{grid-template-columns:minmax(0,1fr)!important}
.tg-z .home h1{font-size:28px}
.tg-z .qgrid{grid-template-columns:110px repeat(3,minmax(200px,1fr));overflow-x:auto}
.tg-z .srow{grid-template-columns:1fr auto}
.tg-z .gsteps li{grid-template-columns:28px minmax(0,1fr)}
.tg-z .confirm-layout{grid-template-columns:minmax(0,1fr);grid-template-areas:"sidebar" "content";gap:18px}
.tg-z .confirm-sidebar{position:relative;top:auto;max-height:none}
.tg-z .confirm-sidebar .envchips{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}`;
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
      const el = t.el?.closest?.("button, a[href], [role=button], [data-a], input, textarea, label, summary");
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
