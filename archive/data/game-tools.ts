/**
 * 게임 만들기 AI 추천 — 게임 제작에 쓰는 AI 툴 목록 (공식 요금 페이지·Similarweb 확인값)
 * 추천 결과의 툴·가격은 모두 여기서만 나와요. Gemini는 손님 글을 해석하는 데만 써요.
 */

/** 게임을 만들 때 하는 일 */
export type Role = "code" | "art2d" | "model3d" | "music" | "sfx" | "voice" | "story";
export type Dim = "2d" | "3d";

export const ROLE_NAMES: Record<Role, string> = {
  code: "게임 만들기·코딩",
  art2d: "그래픽·캐릭터 (2D)",
  model3d: "3D 모델·배경",
  music: "배경음악",
  sfx: "효과음",
  voice: "캐릭터 목소리",
  story: "기획·대사",
};

export interface GameTool {
  key: string;
  name: string;
  url: string;
  roles: Role[];
  dims: Dim[];
  /** 공식 페이지가 코딩·디자인을 몰라도 쓸 수 있다고 안내하는지 */
  beginner: boolean;
  /** 무엇을 하는 툴인지 (쉬운 말, 사실만) */
  what: string;
  /** 돈을 내지 않고 쓸 수 있는지 (무료 체험만 있으면 false) */
  freeStart: boolean | null;
  freeWhat?: string;
  /** 가장 싼 개인 유료 요금 (미국 달러, 월 결제) */
  paidFrom: number | null;
  /** paidFrom 이 연 결제 기준 월 금액이면 true */
  annualOnly?: boolean;
  priceUrl: string;
  /** 무료로 만든 결과물을 판매용 게임에 써도 되는지 (공식 안내가 있을 때만) */
  commercialFree?: boolean | null;
  /** Similarweb 방문 수 (2026년 9월 기준 페이지) */
  visits?: number | null;
}

export const GAME_CHECKED = "2026-10-28";

/** 원화 환산 환율 (고정값) */
export const USD_KRW = { rate: 1327, date: "2026-10-28", source: "https://open.er-api.com/v6/latest/USD" };

export const GAME_TOOLS: GameTool[] = [
  { key: "rosebud", name: "Rosebud AI", url: "https://rosebud.ai", roles: ["code", "art2d"], dims: ["2d", "3d"], beginner: false, what: "글로 설명하면 브라우저 게임을 만들어 줌", freeStart: true, freeWhat: "8,000 크레딧(주간 충전)", paidFrom: 15, priceUrl: "https://rosebud.ai/pricing", commercialFree: false, visits: 612300 },
  { key: "gdevelop", name: "GDevelop", url: "https://gdevelop.io", roles: ["code"], dims: ["2d", "3d"], beginner: true, what: "코딩 없이 만드는 게임 엔진, AI 도우미 포함", freeStart: true, freeWhat: "월 AI 크레딧 40", paidFrom: 7.99, priceUrl: "https://gdevelop.io/pricing/individual", visits: 985100 },
  { key: "robloxassistant", name: "Roblox Assistant", url: "https://create.roblox.com/docs/assistant/guide", roles: ["code", "model3d"], dims: ["3d"], beginner: false, what: "Roblox Studio 안에서 코드·3D 물체를 만드는 AI", freeStart: true, freeWhat: "Studio 무료·절차 모델 하루 50개", paidFrom: null, priceUrl: "https://create.roblox.com/docs/studio" },
  { key: "unityai", name: "Unity AI tools (Assistant)", url: "https://unity.com/products/ai", roles: ["code"], dims: ["2d", "3d"], beginner: false, what: "Unity 에디터 안에서 코드·작업을 돕는 AI", freeStart: false, paidFrom: 10, priceUrl: "https://unity.com/products/ai" },
  { key: "bezi", name: "Bezi", url: "https://www.bezi.com", roles: ["code"], dims: ["2d", "3d"], beginner: false, what: "Unity·Unreal 코드 작성과 오류 찾기 AI", freeStart: false, freeWhat: "체험 100 크레딧", paidFrom: 20, priceUrl: "https://www.bezi.com/pricing", visits: 61500 },
  { key: "buildbox", name: "Buildbox", url: "https://signup.buildbox.com", roles: ["code", "art2d", "story"], dims: ["2d"], beginner: true, what: "끌어다 놓기로 2D 게임 제작, AI 그림 생성", freeStart: null, paidFrom: 14.99, priceUrl: "https://signup.buildbox.com/plans", visits: 73600 },
  { key: "cursor", name: "Cursor", url: "https://cursor.com", roles: ["code"], dims: ["2d", "3d"], beginner: false, what: "AI와 함께 코드를 쓰고 고치는 편집기", freeStart: true, freeWhat: "제한적 에이전트·채팅 요청", paidFrom: 8, priceUrl: "https://cursor.com/pricing", visits: 21500000 },
  { key: "claudecode", name: "Claude Code", url: "https://claude.com/claude-code", roles: ["code"], dims: ["2d", "3d"], beginner: false, what: "명령창에서 파일·코드를 직접 고치는 AI", freeStart: false, paidFrom: 20, priceUrl: "https://claude.com/pricing" },
  { key: "claude", name: "Claude", url: "https://claude.ai", roles: ["code", "story"], dims: ["2d", "3d"], beginner: false, what: "대화로 게임 코드·규칙·대사를 써 줌", freeStart: true, freeWhat: "웹·앱 채팅, 파일 생성", paidFrom: 20, priceUrl: "https://claude.com/pricing", visits: 1000000000 },
  { key: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com", roles: ["code", "story"], dims: ["2d", "3d"], beginner: false, what: "대화로 코드·기획서·대사·그림을 만듦", freeStart: true, freeWhat: "GPT-6 텍스트 무제한·도구 제한", paidFrom: 8, priceUrl: "https://chatgpt.com/pricing", visits: 5900000000 },
  { key: "gemini", name: "Gemini", url: "https://gemini.google.com", roles: ["code", "story"], dims: ["2d", "3d"], beginner: false, what: "구글의 대화형 AI, 코드·글·그림 생성", freeStart: true, freeWhat: "Google 계정으로 무료", paidFrom: 4.99, priceUrl: "https://gemini.google/subscriptions/", visits: 2600000000 },
  { key: "copilot", name: "GitHub Copilot", url: "https://github.com/features/copilot", roles: ["code"], dims: ["2d", "3d"], beginner: false, what: "코드 편집기 안에서 코드를 이어 써 줌", freeStart: true, freeWhat: "Copilot Free(카드 불필요)", paidFrom: 10, priceUrl: "https://github.com/features/copilot/plans" },
  { key: "replit", name: "Replit", url: "https://replit.com", roles: ["code"], dims: ["2d"], beginner: false, what: "브라우저에서 AI가 앱·웹게임을 만들어 실행", freeStart: null, paidFrom: 20, priceUrl: "https://replit.com/pricing", visits: 10900000 },
  { key: "ludo", name: "Ludo.ai", url: "https://ludo.ai", roles: ["art2d", "model3d", "music", "sfx", "voice", "story"], dims: ["2d", "3d"], beginner: true, what: "게임 기획·그림·스프라이트·3D·소리 생성 모음", freeStart: false, paidFrom: 15, annualOnly: true, priceUrl: "https://ludo.ai/pricing", visits: 333300 },
  { key: "scenario", name: "Scenario", url: "https://www.scenario.com", roles: ["art2d", "model3d"], dims: ["2d", "3d"], beginner: false, what: "내 그림체를 학습해 같은 스타일 게임 그림 생성", freeStart: true, freeWhat: "일 50 무료 크레딧", paidFrom: 15, priceUrl: "https://www.scenario.com/pricing", commercialFree: false, visits: 345000 },
  { key: "layer", name: "Layer", url: "https://www.layer.ai", roles: ["art2d", "sfx"], dims: ["2d"], beginner: false, what: "게임 스튜디오용 그림·영상·효과음 생성 작업실", freeStart: true, paidFrom: 10, priceUrl: "https://www.layer.ai/pricing", visits: 228600 },
  { key: "pixellab", name: "PixelLab", url: "https://www.pixellab.ai", roles: ["art2d"], dims: ["2d"], beginner: false, what: "게임용 픽셀아트 캐릭터·애니메이션·타일 생성", freeStart: true, freeWhat: "40회 후 하루 5회 생성", paidFrom: 12, priceUrl: "https://www.pixellab.ai", commercialFree: true, visits: 743300 },
  { key: "leonardo", name: "Leonardo AI", url: "https://leonardo.ai", roles: ["art2d"], dims: ["2d"], beginner: false, what: "게임 아이템·캐릭터 등 그림 생성", freeStart: true, freeWhat: "매일 150 토큰", paidFrom: null, priceUrl: "https://leonardo.ai/pricing", commercialFree: true, visits: 7100000 },
  { key: "midjourney", name: "Midjourney", url: "https://www.midjourney.com", roles: ["art2d"], dims: ["2d"], beginner: false, what: "글로 컨셉 아트 그림을 만드는 AI", freeStart: false, paidFrom: 10, priceUrl: "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans", visits: 8700000 },
  { key: "recraft", name: "Recraft", url: "https://www.recraft.ai", roles: ["art2d"], dims: ["2d"], beginner: false, what: "아이콘·벡터·일러스트 그림 생성", freeStart: true, paidFrom: null, priceUrl: "https://www.recraft.ai/pricing", commercialFree: false, visits: 1500000 },
  { key: "meshy", name: "Meshy", url: "https://www.meshy.ai", roles: ["model3d"], dims: ["3d"], beginner: false, what: "글·사진으로 3D 모델과 질감 생성", freeStart: true, freeWhat: "월 100 크레딧", paidFrom: 20, priceUrl: "https://www.meshy.ai/pricing", commercialFree: true, visits: 20000000 },
  { key: "tripo", name: "Tripo", url: "https://www.tripo3d.ai", roles: ["model3d"], dims: ["3d"], beginner: false, what: "사진·글로 3D 모델 생성, 뼈대 넣기", freeStart: true, freeWhat: "월 200 크레딧(약 13모델)", paidFrom: 20, annualOnly: true, priceUrl: "https://www.tripo3d.ai/pricing", commercialFree: false, visits: 14600000 },
  { key: "rodin", name: "Hyper3D Rodin", url: "https://www.hyper3d.ai", roles: ["model3d"], dims: ["3d"], beginner: false, what: "사진·글로 정밀한 3D 모델 생성", freeStart: true, freeWhat: "확정 전 무료 생성·10개 저장", paidFrom: 30, priceUrl: "https://hyper3d.ai/pricing", commercialFree: false, visits: 9700000 },
  { key: "sloyd", name: "Sloyd", url: "https://www.sloyd.ai", roles: ["model3d"], dims: ["3d"], beginner: false, what: "글·사진으로 게임용 3D 모델·애니메이션 생성", freeStart: true, freeWhat: "하루 1회 AI 3D 생성", paidFrom: 15, priceUrl: "https://www.sloyd.ai/pricing", commercialFree: false, visits: 454100 },
  { key: "spline", name: "Spline", url: "https://spline.design", roles: ["model3d"], dims: ["3d"], beginner: false, what: "웹에서 3D 장면을 만들고 공유", freeStart: false, freeWhat: "무료 요금제엔 AI 크레딧 없음", paidFrom: 15, priceUrl: "https://spline.design/pricing", visits: 626400 },
  { key: "suno", name: "Suno", url: "https://suno.com", roles: ["music"], dims: ["2d", "3d"], beginner: false, what: "글로 노래·배경음악을 만드는 AI", freeStart: true, freeWhat: "무료 모델·다운로드 없음", paidFrom: 8, priceUrl: "https://suno.com/pricing", commercialFree: false, visits: 75500000 },
  { key: "udio", name: "Udio", url: "https://www.udio.com", roles: ["music"], dims: ["2d", "3d"], beginner: false, what: "글로 노래·배경음악을 만드는 AI", freeStart: true, freeWhat: "일 10·월 100 크레딧", paidFrom: 10, priceUrl: "https://www.udio.com/pricing", visits: 1100000 },
  { key: "soundraw", name: "SOUNDRAW", url: "https://soundraw.io", roles: ["music"], dims: ["2d", "3d"], beginner: false, what: "분위기·길이를 골라 배경음악 생성", freeStart: null, paidFrom: 16.99, priceUrl: "https://soundraw.io/pricing", visits: 223300 },
  { key: "stableaudio", name: "Stable Audio", url: "https://stableaudio.com", roles: ["music", "sfx"], dims: ["2d", "3d"], beginner: false, what: "글로 음악·효과음 생성", freeStart: true, freeWhat: "월 50 크레딧·상업 라이선스", paidFrom: 12, priceUrl: "https://stableaudio.com/pricing", commercialFree: true, visits: 126700 },
  { key: "aiva", name: "AIVA", url: "https://www.aiva.ai", roles: ["music"], dims: ["2d", "3d"], beginner: true, what: "250가지 장르로 배경음악 작곡", freeStart: true, freeWhat: "월 3곡 다운로드(비상업)", paidFrom: null, annualOnly: true, priceUrl: "https://www.aiva.ai/pricing", commercialFree: false, visits: 142800 },
  { key: "elevenlabs", name: "ElevenLabs", url: "https://elevenlabs.io", roles: ["voice", "sfx", "music"], dims: ["2d", "3d"], beginner: false, what: "글로 목소리·효과음·음악 생성", freeStart: true, freeWhat: "월 10k 크레딧", paidFrom: 6, priceUrl: "https://elevenlabs.io/pricing", commercialFree: false, visits: 33600000 },
  { key: "typecast", name: "Typecast", url: "https://typecast.ai", roles: ["voice"], dims: ["2d", "3d"], beginner: false, what: "글을 캐릭터 목소리로 읽어 주는 AI", freeStart: true, freeWhat: "생성 무료·평생 3,000 크레딧", paidFrom: 5, priceUrl: "https://typecast.ai/pricing", commercialFree: false, visits: 1300000 },
  { key: "inworld", name: "Inworld AI", url: "https://inworld.ai", roles: ["voice"], dims: ["2d", "3d"], beginner: false, what: "목소리 합성·AI 대화 기능을 앱에 붙이는 API", freeStart: true, freeWhat: "TTS 최대 70분 포함", paidFrom: 25, priceUrl: "https://inworld.ai/pricing", commercialFree: true, visits: 459700 },
  { key: "convai", name: "Convai", url: "https://convai.com", roles: ["story", "voice"], dims: ["2d", "3d"], beginner: false, what: "게임 속 말하는 AI NPC 캐릭터 제작", freeStart: true, freeWhat: "월 100회 대화", paidFrom: 29, priceUrl: "https://convai.com/pricing", visits: 106400 },
];
