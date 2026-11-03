/*
 * 키오스크 화면 한글 키보드 — 파이 터치 화면에는 실물 키보드가 없어요.
 * 글자 입력칸(textarea, 글자 input)을 누르면 아래에서 키보드가 올라오고,
 * [완료]를 누르면 입력칸에 글자를 넣은 뒤 input·change 이벤트를 보내요 (화면 코드가 그대로 받아요).
 * 한글 조합은 /kiosk/vendor/hangul.min.js (MIT) 를 써요.
 */
(() => {
  "use strict";
  if (window.TouchKB) return;

  const TEXT_TYPES = ["text", "search", "email", "url", "tel", "number", ""];
  const isField = (el) =>
    el && !el.disabled && !el.readOnly &&
    (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && TEXT_TYPES.includes((el.getAttribute("type") || "").toLowerCase())));

  /* ───────── 모양 ───────── */
  const css = `
.tkb{position:fixed;left:0;right:0;bottom:0;z-index:1000;padding:8px 8px max(8px,env(safe-area-inset-bottom));
  background:rgba(18,20,23,.98);border-top:1px solid #545a63;box-shadow:0 -20px 60px rgba(0,0,0,.6);
  transform:translateY(100%);transition:transform .25s cubic-bezier(.2,1.1,.3,1);font-family:'IBM Plex Sans KR',system-ui,sans-serif;color:#d9dde3}
.tkb.in{transform:none}
.tkb-head{display:flex;align-items:center;gap:10px;padding:0 4px 6px}
.tkb-label{flex:1;font-size:13px;color:#acb3bc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tkb-head button{border:0;border-radius:10px;min-height:36px;padding:0 14px;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.tkb-cancel{background:transparent;color:#acb3bc;border:1px solid #545a63!important}
.tkb-done{background:#94e2d5;color:#121417}
.tkb-field{min-height:40px;max-height:72px;overflow-y:auto;padding:8px 12px;margin-bottom:6px;border-radius:12px;background:#22262c;border:1px solid #94e2d5;font-size:17px;line-height:1.4;word-break:break-all;white-space:pre-wrap}
.tkb-caret{display:inline-block;width:2px;height:1.1em;margin-left:1px;vertical-align:-2px;background:#94e2d5;animation:tkb-blink 1s steps(1) infinite}
@keyframes tkb-blink{50%{opacity:0}}
.tkb-keys{display:flex;flex-direction:column;gap:5px}
.tkb-row{display:flex;gap:5px;justify-content:center}
.tkb-row button{flex:1;max-width:76px;min-height:clamp(36px,7.2vh,52px);border:0;border-radius:10px;background:#30343a;color:#d9dde3;font:inherit;font-size:clamp(16px,3.4vh,20px);font-weight:600;cursor:pointer;touch-action:manipulation}
.tkb-row button.fn{background:#22262c;color:#acb3bc;font-size:14px;flex:1.3}
.tkb-row button.fn.on{background:#2f514c;color:#fff}
.tkb-row button.space{flex:4;max-width:none;font-size:14px;color:#acb3bc}
.tkb-row button.go{background:#94e2d5;color:#121417;font-weight:800}
.tkb-row.last button{max-width:none}
.tkb-row button:active{background:#2f514c}
body.tkb-open{padding-bottom:var(--tkb-h,0px)}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ───────── 한글 조합 ───────── */
  let hangulReady = null;
  const loadHangul = () => hangulReady || (hangulReady = new Promise((res) => {
    if (window.Hangul) return res();
    const s = document.createElement("script");
    s.src = "/kiosk/vendor/hangul.min.js"; s.onload = res; s.onerror = res;
    document.head.appendChild(s);
  }));
  loadHangul();

  const LAYOUT = {
    ko: [["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"], ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"], ["⇧", "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "⌫"]],
    koS: [["ㅃ", "ㅉ", "ㄸ", "ㄲ", "ㅆ", "ㅛ", "ㅕ", "ㅑ", "ㅒ", "ㅖ"], ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"], ["⇧", "ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ", "⌫"]],
    en: [["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"], ["a", "s", "d", "f", "g", "h", "j", "k", "l"], ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"]],
    enS: [["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], ["A", "S", "D", "F", "G", "H", "J", "K", "L"], ["⇧", "Z", "X", "C", "V", "B", "N", "M", "⌫"]],
    num: [["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], ["-", "/", ":", "(", ")", "₩", "%", "~", "×"], ["!", "?", ",", ".", "'", "+", "=", "@", "⌫"]],
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* 입력칸 이름: 연결된 label → aria-label → placeholder */
  const labelOf = (el) => {
    const l = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    return (l && l.textContent.trim()) || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "입력";
  };
  const numericOnly = (el) => el.getAttribute("inputmode") === "numeric" || el.dataset.tkbMode === "num" || (el.getAttribute("type") || "") === "number";

  /* ───────── 키보드 ───────── */
  let kb = null;
  async function open(el) {
    await loadHangul();
    close();
    const id = el.id;
    const max = el.maxLength > 0 ? el.maxLength : 600;
    let jamo = window.Hangul ? window.Hangul.disassemble(el.value || "") : (el.value || "").split("");
    let mode = numericOnly(el) ? "num" : "ko", shift = false;
    const text = () => (window.Hangul ? window.Hangul.assemble(jamo) : jamo.join(""));

    kb = document.createElement("div");
    kb.className = "tkb";
    kb.setAttribute("role", "dialog");
    kb.setAttribute("aria-label", "입력 키보드");
    kb.innerHTML = `<div class="tkb-head"><span class="tkb-label"></span><button type="button" class="tkb-cancel">취소</button><button type="button" class="tkb-done">완료</button></div>
      <div class="tkb-field"><span class="tkb-text"></span><span class="tkb-caret"></span></div><div class="tkb-keys"></div>`;
    kb.querySelector(".tkb-label").textContent = labelOf(el);
    document.body.appendChild(kb);
    requestAnimationFrame(() => {
      if (!kb) return;
      kb.classList.add("in");
      document.body.style.setProperty("--tkb-h", kb.offsetHeight + "px");
      document.body.classList.add("tkb-open");
    });

    const draw = () => {
      kb.querySelector(".tkb-text").textContent = text();
      const rows = LAYOUT[mode === "num" ? "num" : mode + (shift ? "S" : "")];
      kb.querySelector(".tkb-keys").innerHTML = rows.map((r) => `<div class="tkb-row">${r.map((k) =>
        `<button type="button" class="${k === "⇧" ? "fn" + (shift ? " on" : "") : k === "⌫" ? "fn" : ""}" data-k="${esc(k)}">${esc(k)}</button>`).join("")}</div>`).join("") +
        `<div class="tkb-row last"><button type="button" class="fn" data-k="mode-num">${mode === "num" ? "한/영" : "123"}</button>
          <button type="button" class="fn" data-k="mode-lang">${mode === "en" ? "한글" : "ABC"}</button>
          <button type="button" class="space" data-k=" ">띄어쓰기</button>
          <button type="button" class="fn" data-k=".">.</button>
          <button type="button" class="fn go" data-k="done">완료</button></div>`;
      const f = kb.querySelector(".tkb-field"); f.scrollTop = f.scrollHeight;
    };
    draw();

    // 화면이 다시 그려져서 입력칸이 바뀌어도 같은 id 로 다시 찾아 넣어요
    const finish = () => {
      const v = text().slice(0, max);
      close();
      const target = (id && document.getElementById(id)) || el;
      if (!target.isConnected) return;
      target.value = v;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    };
    kb.querySelector(".tkb-done").onclick = finish;
    kb.querySelector(".tkb-cancel").onclick = close;
    kb.querySelector(".tkb-keys").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const k = b.dataset.k;
      if (k === "done") return finish();
      if (k === "⌫") jamo.pop();
      else if (k === "⇧") shift = !shift;
      else if (k === "mode-num") { mode = mode === "num" ? "ko" : "num"; shift = false; }
      else if (k === "mode-lang") { mode = mode === "en" ? "ko" : "en"; shift = false; }
      else if (jamo.length < max * 3) { jamo.push(k); if (shift && mode !== "num") shift = false; }
      draw();
    });
  }
  function close() {
    if (!kb) return;
    const k = kb; kb = null;
    k.classList.remove("in");
    document.body.classList.remove("tkb-open");
    setTimeout(() => k.remove(), 220);
  }

  // 입력칸을 누르면 휴대폰식 기본 키보드 대신 이 키보드를 열어요
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest && e.target.closest("textarea, input");
    if (!isField(el)) return;
    if (el.getAttribute("inputmode") === "numeric") el.dataset.tkbMode = "num"; // 숫자 칸은 숫자 키부터
    el.setAttribute("inputmode", "none");
  }, true);
  document.addEventListener("click", (e) => {
    if (kb && kb.contains(e.target)) return;
    const el = e.target.closest && e.target.closest("textarea, input");
    if (!isField(el)) return;
    el.blur();
    open(el);
  }, true);

  window.TouchKB = { open, close };
})();
