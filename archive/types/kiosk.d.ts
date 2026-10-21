// public/kiosk/kiosk.js 가 window 에 붙이는 API
interface KioskApi {
  startSession(entry: string): { id: string };
  endSession(reason: string): void;
  track(type: string, data?: Record<string, unknown>): void;
  flush(): Promise<void>;
  enabled(): boolean;
}
interface Window {
  KIOSK?: KioskApi;
}
