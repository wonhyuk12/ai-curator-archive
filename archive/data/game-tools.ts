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

export const GAME_TOOLS: GameTool[] = [];
