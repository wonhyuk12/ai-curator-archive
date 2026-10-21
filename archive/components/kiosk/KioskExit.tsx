"use client";

import { LogOut } from "lucide-react";

// 키오스크: 아카이브에서 처음 화면(/kiosk)으로 나가는 버튼
export function KioskExit() {
  const exit = () => {
    if (window.KIOSK?.goHome) return window.KIOSK.goHome("exit");
    window.KIOSK?.endSession("exit");
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 전체 새로고침으로 시작 화면 (세션 초기화)
    window.location.href = "/kiosk";
  };
  return (
    <button
      type="button"
      onClick={exit}
      data-track="아카이브 나가기"
      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-[#FF2E88]/60 bg-[#FF2E88]/10 px-4 font-sans text-sm font-bold tracking-normal text-white shadow-[0_0_18px_-6px_#FF2E88] transition-colors active:bg-[#FF2E88]/25"
    >
      <LogOut className="h-4 w-4 text-[#FF2E88]" />
      나가기
    </button>
  );
}
