/*
 * 키오스크: 1분 동안 아무도 만지지 않으면 첫 화면으로 돌아가요 (다음 손님을 위해 입력한 내용도 지워요).
 * 화면 상태는 페이지 안에만 있어서, 페이지를 다시 불러오면 첫 화면이 돼요.
 * 손님이 한 번이라도 만진 뒤에만 돌아가요 (아무도 없을 때 1분마다 깜빡이지 않게).
 */
(() => {
  "use strict";
  const IDLE_MS = 60 * 1000;
  let touched = false;
  let timer = null;
  const reset = () => { if (touched) location.replace(location.pathname); };
  const poke = () => {
    touched = true;
    clearTimeout(timer);
    timer = setTimeout(reset, IDLE_MS);
  };
  ["pointerdown", "keydown", "input", "wheel", "touchstart"].forEach((ev) => document.addEventListener(ev, poke, { capture: true, passive: true }));
  window.addEventListener("scroll", poke, { passive: true });
})();
