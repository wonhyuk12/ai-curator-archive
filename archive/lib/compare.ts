import { TOOLS, type SubField, type ToolKey } from "@/data/archive";
import { BOARDS, FIELD_BOARD, TAG_BOARD, TOOL_METRICS, TOOL_SKILL, type Board, type BoardInfo, type ToolMetric } from "@/data/tool-metrics";

export interface ToolRow {
  key: ToolKey;
  name: string;
  /** 실력 점수 (분야 측정에 값이 있을 때만) */
  skill: { score: number; rank: number; entry: string; place: number } | null;
  /** 최근 3개월 방문 수와 분야 안 순위 */
  users: { visits: number; place: number } | null;
  metric: ToolMetric;
}

export interface FieldCompare {
  n: number;
  board: Board | null;
  boardInfo: BoardInfo | null;
  rows: ToolRow[];
  skillCount: number;
  userCount: number;
}

/** 분야를 잴 측정: 툴 태그가 가리키는 측정 중, 분야 안에서 점수가 있는 툴이 2개 이상인 것 */
function pickBoard(field: SubField, key?: string): Board | null {
  if (key && key in FIELD_BOARD) { const b = FIELD_BOARD[key]; return b && field.tools.filter((t) => TOOL_SKILL[t.tool]?.[b]).length >= 2 ? b : null; }
  const votes = new Map<Board, number>();
  for (const t of field.tools) {
    const b = TAG_BOARD[t.tag];
    if (b) votes.set(b, (votes.get(b) ?? 0) + 1);
  }
  const scored = (b: Board) => field.tools.filter((t) => TOOL_SKILL[t.tool]?.[b]).length;
  const ordered = [...votes.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b);
  return ordered.find((b) => scored(b) >= 2 && BOARDS[b]) ?? null;
}

/** key = "작업/분야" (예: "office/sheet") — 분야별로 직접 정한 측정이 있으면 그걸 써요 */
export function compareField(field: SubField, key?: string): FieldCompare {
  const board = pickBoard(field, key);
  const rows: ToolRow[] = field.tools.map((t) => {
    const s = board ? TOOL_SKILL[t.tool]?.[board] : undefined;
    const m = TOOL_METRICS[t.tool] ?? {};
    return {
      key: t.tool,
      name: TOOLS[t.tool].name,
      skill: s ? { ...s, place: 0 } : null,
      users: m.visits ? { visits: m.visits, place: 0 } : null,
      metric: m,
    };
  });
  [...rows].filter((r) => r.skill).sort((a, b) => b.skill!.score - a.skill!.score || a.skill!.rank - b.skill!.rank).forEach((r, i) => (r.skill!.place = i + 1));
  [...rows].filter((r) => r.users).sort((a, b) => b.users!.visits - a.users!.visits).forEach((r, i) => (r.users!.place = i + 1));
  return {
    n: rows.length,
    board,
    boardInfo: board ? BOARDS[board] ?? null : null,
    rows,
    skillCount: rows.filter((r) => r.skill).length,
    userCount: rows.filter((r) => r.users).length,
  };
}

/** 방문 수를 한국어로: 1.2억 / 3,400만 / 85만 / 9,000 */
export function fmtVisits(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(n >= 1e9 ? 0 : 1)}억`;
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString("en-US")}만`;
  return n.toLocaleString("en-US");
}

export const fmtUsd = (v: number) => (Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);

/** 비용 한 줄: "무료로 시작 · 유료 월 $20부터" */
export function costText(m: ToolMetric): string {
  const free = m.freeStart === true ? "무료로 시작" : m.freeStart === false ? "무료 없음" : null;
  const paid = m.paidFrom != null ? `유료 월 ${fmtUsd(m.paidFrom)}부터${m.annualOnly ? " (연 결제)" : ""}` : null;
  return [free, paid].filter(Boolean).join(" · ") || "요금 확인 못 함";
}

/** 이 툴을 같은 분야 다른 툴과 비교한 문장들 (숫자 포함) */
export function compareSentences(c: FieldCompare, key: ToolKey): string[] {
  const me = c.rows.find((r) => r.key === key)!;
  const out: string[] = [];
  if (me.skill && c.skillCount >= 2 && c.boardInfo) {
    const bySkill = c.rows.filter((r) => r.skill).sort((a, b) => a.skill!.place - b.skill!.place);
    const top = bySkill[0];
    if (me.skill.place === 1) {
      const second = bySkill[1];
      const d = me.skill.score - second.skill!.score;
      out.push(d > 0
        ? `${c.boardInfo.name} ${me.skill.score.toLocaleString("en-US")}점(${me.skill.entry} 기준)으로 같은 분야 ${second.name}(${second.skill!.score.toLocaleString("en-US")}점)보다 ${d.toLocaleString("en-US")}점 높아요.`
        : `${c.boardInfo.name} ${me.skill.score.toLocaleString("en-US")}점으로 같은 분야 ${second.name}도 같은 점수예요.`);
    } else {
      const d = top.skill!.score - me.skill.score;
      out.push(`${c.boardInfo.name} ${me.skill.score.toLocaleString("en-US")}점(${me.skill.entry} 기준)으로, 이 분야 1위 ${top.name}(${top.skill!.score.toLocaleString("en-US")}점)보다 ${d.toLocaleString("en-US")}점 낮아요.`);
    }
  }
  if (me.users && c.userCount >= 2) {
    const byUsers = c.rows.filter((r) => r.users).sort((a, b) => a.users!.place - b.users!.place);
    if (me.users.place === 1) {
      const second = byUsers[1];
      const x = me.users.visits / second.users!.visits;
      out.push(`최근 3개월 방문 ${fmtVisits(me.users.visits)} 번으로 이 분야에서 가장 많이 쓰여요 (${second.name}의 ${x >= 10 ? Math.round(x) : x.toFixed(1)}배).`);
    } else {
      out.push(`최근 3개월 방문 ${fmtVisits(me.users.visits)} 번으로 이 분야 ${c.userCount}개 중 ${me.users.place}위예요 (1위 ${byUsers[0].name} ${fmtVisits(byUsers[0].users!.visits)} 번).`);
    }
  }
  return out;
}
