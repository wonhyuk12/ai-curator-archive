"use client";

import { useSyncExternalStore } from "react";

// 키오스크 모드 여부 (/kiosk 첫 화면에서 켜짐 → localStorage "kiosk.on")
const read = () => {
  try {
    return JSON.parse(localStorage.getItem("kiosk.on") ?? "false") === true;
  } catch {
    return false;
  }
};
const subscribe = (cb: () => void) => {
  addEventListener("storage", cb);
  return () => removeEventListener("storage", cb);
};

export function useKiosk() {
  return useSyncExternalStore(subscribe, read, () => false);
}
