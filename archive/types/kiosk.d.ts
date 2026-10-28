// public/kiosk/kiosk.js 가 window 에 붙이는 API
interface KioskApi {
  startSession(entry: string): { id: string };
  endSession(reason: string): void;
  track(type: string, data?: Record<string, unknown>): void;
  flush(): Promise<void>;
  enabled(): boolean;
  goHome?(reason: string): void;
  /** 키오스크 화면 한글 키보드 (키오스크 모드에서만) */
  openKeyboard?(initial: string, onDone: (text: string) => void, label: string): Promise<void>;
}
interface Window {
  KIOSK?: KioskApi;
}
