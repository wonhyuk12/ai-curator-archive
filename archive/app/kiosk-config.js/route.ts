// 키오스크 위젯 설정을 환경 변수에서 읽어 JS 로 내려줘요 (키를 코드에 넣지 않기 위해).
export const dynamic = "force-static";

export function GET() {
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    idleSeconds: Number(process.env.NEXT_PUBLIC_KIOSK_IDLE_SECONDS ?? 120),
    prize: process.env.NEXT_PUBLIC_KIOSK_PRIZE ?? "스타벅스 아메리카노",
  };
  return new Response(`window.KIOSK_CONFIG = ${JSON.stringify(config)};\n`, {
    headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" },
  });
}
