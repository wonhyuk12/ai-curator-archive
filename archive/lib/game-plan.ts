import { GAME_TOOLS, USD_KRW, type Dim, type GameTool, type Role } from "@/data/game-tools";

/** 손님 글에서 뽑은 것 (Gemini 또는 키워드) */
export interface GameIntent {
  genre: string | null;
  dim: Dim | "unknown";
  codingLevel: "none" | "some" | "good" | "unknown";
  needs: Role[];
}

export const ROLES: Role[] = ["code", "art2d", "model3d", "music", "sfx", "voice", "story"];

/** 예산 (원/월). null = 상관없음 */
export type Budget = 0 | 10000 | 30000 | null;

export const BUDGETS: { value: Budget; label: string }[] = [
  { value: 0, label: "무료만" },
  { value: 10000, label: "월 1만 원까지" },
  { value: 30000, label: "월 3만 원까지" },
  { value: null, label: "상관없음" },
];

const GENRES: [RegExp, string][] = [
  [/rpg|알피지|롤플레잉/i, "RPG"],
  [/퍼즐|puzzle/i, "퍼즐"],
  [/비주얼\s*노벨|미연시|노벨/i, "비주얼노벨"],
  [/플랫포머|횡스크롤|점프/i, "플랫포머"],
  [/슈팅|fps|총/i, "슈팅"],
  [/레이싱|자동차|경주/i, "레이싱"],
  [/전략|디펜스|타워/i, "전략·디펜스"],
  [/리듬|음악\s*게임/i, "리듬"],
  [/공포|호러/i, "공포"],
  [/시뮬|농장|경영|타이쿤/i, "시뮬레이션"],
  [/액션|격투/i, "액션"],
  [/카드|덱/i, "카드"],
];

/** 키워드로 뽑기 — Gemini를 못 쓸 때 대신 */
export function parseByKeywords(text: string): GameIntent {
  const t = text.toLowerCase();
  const dim: GameIntent["dim"] = /3d|입체|3차원/.test(t) ? "3d" : /2d|도트|픽셀|횡스크롤|비주얼\s*노벨|카드|2차원/.test(t) ? "2d" : "unknown";
  const codingLevel: GameIntent["codingLevel"] = /코딩.{0,6}(몰|못|처음|모름|없)|초보|노코드|처음/.test(t) ? "none" : /개발자|코딩.{0,4}(잘|가능|할 줄)|프로그래머/.test(t) ? "good" : "unknown";
  const needs = new Set<Role>(["code"]);
  needs.add(dim === "3d" ? "model3d" : "art2d");
  if (/음악|bgm|배경음|노래/.test(t)) needs.add("music");
  if (/효과음|사운드|소리/.test(t)) needs.add("sfx");
  if (/목소리|더빙|성우|음성/.test(t)) needs.add("voice");
  if (/스토리|대사|시나리오|npc|기획|세계관/.test(t)) needs.add("story");
  return { genre: GENRES.find(([re]) => re.test(text))?.[1] ?? null, dim, codingLevel, needs: [...needs] };
}

/** Gemini 답을 검사해서 우리 형식으로 (이상한 값은 버려요) */
export function sanitizeIntent(raw: unknown): GameIntent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const dim = r.dim === "2d" || r.dim === "3d" ? r.dim : "unknown";
  const codingLevel = r.codingLevel === "none" || r.codingLevel === "some" || r.codingLevel === "good" ? r.codingLevel : "unknown";
  const needs = Array.isArray(r.needs) ? r.needs.filter((x): x is Role => ROLES.includes(x as Role)) : [];
  const genre = typeof r.genre === "string" && r.genre.trim() ? r.genre.trim().slice(0, 20) : null;
  return { genre, dim, codingLevel, needs };
}

export const krw = (usd: number) => Math.round((usd * USD_KRW.rate) / 100) * 100;
export const fmtKrw = (won: number) => `${won.toLocaleString("ko-KR")}원`;

/** 추천할 일 4가지: 코딩 → 그래픽(2D/3D) → 음악 → (목소리·대사·효과음 중 요청한 것, 없으면 효과음) */
export function pickRoles(intent: GameIntent): Role[] {
  const art: Role = intent.dim === "3d" ? "model3d" : "art2d";
  const fourth: Role = intent.needs.includes("voice") ? "voice" : intent.needs.includes("story") ? "story" : "sfx";
  return ["code", art, "music", fourth];
}

export interface Pick {
  role: Role;
  tool: GameTool;
  /** 예산에 넣은 월 비용 (원). 무료로 시작하면 0 */
  cost: number;
  /** 유료로 올리면 드는 월 비용 (원) */
  paidKrw: number | null;
  /** 다른 후보 (같은 일, 예산 안) */
  alternatives: GameTool[];
}

export interface Plan {
  picks: Pick[];
  total: number;
  /** 예산 안에 맞는 툴을 못 찾은 일 */
  missing: Role[];
}

/** 추천 순서 점수: 그 일이 주력인 툴 → 초보자용(코딩을 모르면) → 이용자 수 (아주 큰 범용 서비스는 3,000만에서 끊어요) */
function score(t: GameTool, intent: GameIntent, role: Role): number {
  let s = Math.log10(Math.min(Math.max(t.visits ?? 1e4, 1e4), 3e7));
  if (role === "code" && (intent.codingLevel === "none" || intent.codingLevel === "unknown") && t.beginner) s += 2;
  if (role === "code" && intent.codingLevel === "good" && !t.beginner) s += 1;
  if (minCost(t) === 0) s += 0.3; // 비슷하면 무료로 쓸 수 있는 쪽
  if (t.roles[0] === role) s += 1.5; // 그 일이 주력인 툴 (예: 배경음악은 음악 전문 툴)
  return s;
}

/** 게임에 실제로 쓰려면 드는 최소 월 비용 (원).
 *  무료 요금제 결과물을 판매용 게임에 못 쓰는 툴은(공식 안내 기준) 유료 요금으로 셈해요 */
export const minCost = (t: GameTool) =>
  t.freeStart && t.commercialFree !== false ? 0 : t.paidFrom != null ? krw(t.paidFrom) : Infinity;

export function makePlan(intent: GameIntent, budget: Budget): Plan {
  const used = new Set<string>();
  let left = budget ?? Infinity;
  const picks: Pick[] = [];
  const missing: Role[] = [];
  for (const role of pickRoles(intent)) {
    const fits = GAME_TOOLS.filter((t) => t.roles.includes(role) && (intent.dim === "unknown" || t.dims.includes(intent.dim)) && minCost(t) <= left)
      .sort((a, b) => score(b, intent, role) - score(a, intent, role));
    const tool = fits.find((t) => !used.has(t.key)) ?? fits[0];
    if (!tool) { missing.push(role); continue; }
    used.add(tool.key);
    const cost = minCost(tool);
    left -= cost;
    picks.push({ role, tool, cost, paidKrw: tool.paidFrom != null ? krw(tool.paidFrom) : null, alternatives: fits.filter((t) => t.key !== tool.key).slice(0, 2) });
  }
  return { picks, total: picks.reduce((a, p) => a + p.cost, 0), missing };
}
