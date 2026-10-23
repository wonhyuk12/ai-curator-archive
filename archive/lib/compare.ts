import { TOOLS, type SubField, type ToolKey } from "@/data/archive";
import { BOARDS, FIELD_BOARD, GENERAL_TOOLS, SCORE_TIE, TAG_BOARD, TOOL_METRICS, TOOL_SKILL, type Board, type BoardInfo, type ToolMetric } from "@/data/tool-metrics";

export interface ToolRow {
  key: ToolKey;
  name: string;
  /** 여러 일에 두루 쓰는 범용 AI (방문 수가 사이트 전체라 전문 툴과 따로 봐요) */
  general: boolean;
  /** 실력 점수 (분야 측정에 값이 있을 때만). place = 분야 안 순위, 같은 점수는 같은 순위 */
  skill: { score: number; rank: number; entry: string; place: number } | null;
  /** 방문 수와 순위. place = 같은 무리(범용끼리 / 전문 툴끼리) 안의 순위 */
  users: { visits: number; place: number } | null;
  metric: ToolMetric;
}

export interface FieldCompare {
  n: number;
  board: Board | null;
  boardInfo: BoardInfo | null;
  rows: ToolRow[];
  skillCount: number;
  /** 방문 순위를 범용 AI와 전문 툴로 나눴는지 (분야에 둘이 섞여 있으면 true) */
  split: boolean;
}

/** 분야를 잴 측정: 직접 정한 것이 있으면 그것, 아니면 툴 태그가 가리키는 측정 중 점수 있는 툴이 2개 이상인 것 */
function pickBoard(field: SubField, key?: string): Board | null {
  const scored = (b: Board) => field.tools.filter((t) => TOOL_SKILL[t.tool]?.[b]).length;
  if (key && key in FIELD_BOARD) {
    const b = FIELD_BOARD[key];
    return b && scored(b) >= 2 ? b : null;
  }
  const votes = new Map<Board, number>();
  for (const t of field.tools) {
    const b = TAG_BOARD[t.tag];
    if (b) votes.set(b, (votes.get(b) ?? 0) + 1);
  }
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
      general: GENERAL_TOOLS.has(t.tool),
      skill: s ? { ...s, place: 0 } : null,
      users: m.visits ? { visits: m.visits, place: 0 } : null,
      metric: m,
    };
  });
  const withSkill = rows.filter((r) => r.skill);
  const bySkill = [...withSkill].sort((a, b) => b.skill!.score - a.skill!.score);
  bySkill.forEach((r, i) => (r.skill!.place = i > 0 && r.skill!.score === bySkill[i - 1].skill!.score ? bySkill[i - 1].skill!.place : i + 1));
  // 범용 AI와 전문 툴이 섞인 분야는 방문 순위를 따로 매겨요 (사이트 전체 방문을 전문 툴과 겨루지 않게)
  const split = rows.some((r) => r.general) && rows.some((r) => !r.general);
  for (const group of split ? [rows.filter((r) => r.general), rows.filter((r) => !r.general)] : [rows]) {
    const byUsers = group.filter((r) => r.users).sort((a, b) => b.users!.visits - a.users!.visits);
    byUsers.forEach((r, i) => (r.users!.place = i + 1));
  }
  return { n: rows.length, board, boardInfo: board ? BOARDS[board] ?? null : null, rows, skillCount: withSkill.length, split };
}

/** 이 툴이 실력 1위로 확실히 앞서는지 (2위와 차이가 측정 오차보다 클 때만) */
export function clearSkillLead(c: FieldCompare, key: ToolKey): boolean {
  const me = c.rows.find((r) => r.key === key)?.skill;
  if (!me || me.place !== 1) return false;
  const next = c.rows.filter((r) => r.skill && r.key !== key).map((r) => r.skill!.score).sort((a, b) => b - a)[0];
  return next === undefined || me.score - next >= SCORE_TIE;
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
  const paid = m.paidFrom != null ? `유료 월 ${fmtUsd(m.paidFrom)}부터${m.annualOnly ? " (연 결제·연 약정)" : ""}` : null;
  return [free, paid].filter(Boolean).join(" · ") || "요금 확인 못 함";
}

/** 표 칸용 짧은 비용 */
export function costShort(m: ToolMetric): string {
  if (m.freeStart === true) return "무료 시작";
  if (m.paidFrom != null) return `${fmtUsd(m.paidFrom)}~${m.annualOnly ? " (연)" : ""}`;
  return m.freeStart === false ? "유료" : "–";
}

const n = (v: number) => v.toLocaleString("en-US");

/** 이 툴을 같은 분야 다른 툴과 비교한 문장들 (숫자 포함) */
export function compareSentences(c: FieldCompare, key: ToolKey): string[] {
  const me = c.rows.find((r) => r.key === key)!;
  const out: string[] = [];
  if (me.skill && c.skillCount >= 2 && c.boardInfo) {
    const others = c.rows.filter((r) => r.skill && r.key !== key).sort((a, b) => b.skill!.score - a.skill!.score);
    const mine = `${c.boardInfo.name} ${n(me.skill.score)}점(${me.skill.entry} 기준)`;
    if (me.skill.place === 1) {
      const second = others[0];
      const d = me.skill.score - second.skill!.score;
      out.push(d >= SCORE_TIE
        ? `${mine}으로 같은 분야 ${second.name}(${n(second.skill!.score)}점)보다 ${n(d)}점 높아요.`
        : `${mine}으로 같은 분야 ${second.name}(${n(second.skill!.score)}점)과 ${d}점 차이라, 측정 오차 안에서 비슷한 수준이에요.`);
    } else {
      const top = others[0];
      const d = top.skill!.score - me.skill.score;
      out.push(d >= SCORE_TIE
        ? `${mine}으로, 이 분야 1위 ${top.name}(${n(top.skill!.score)}점)보다 ${n(d)}점 낮아요.`
        : `${mine}으로, 이 분야 1위 ${top.name}(${n(top.skill!.score)}점)과 ${d}점 차이라 측정 오차 안에서 비슷한 수준이에요.`);
    }
  }
  if (me.users) {
    const peers = c.rows.filter((r) => r.users && (!c.split || r.general === me.general)).sort((a, b) => a.users!.place - b.users!.place);
    const kind = c.split ? (me.general ? "이 분야의 범용 AI" : "이 분야의 전문 툴") : "이 분야";
    const visits = `사이트 방문 ${fmtVisits(me.users.visits)} 번`;
    if (me.general) {
      out.push(peers.length >= 2
        ? `${visits}으로 ${kind} ${peers.length}개 중 ${me.users.place}위예요. 여러 일에 두루 쓰는 AI라 이 작업만 센 숫자는 아니에요.`
        : `${visits}이에요. 여러 일에 두루 쓰는 AI라 이 작업만 센 숫자는 아니에요.`);
    } else if (peers.length >= 2) {
      if (me.users.place === 1) {
        const x = me.users.visits / peers[1].users!.visits;
        out.push(`${visits}으로 ${kind} 중 가장 많아요 (${peers[1].name}의 ${x >= 10 ? Math.round(x) : x.toFixed(1)}배).`);
      } else {
        out.push(`${visits}으로 ${kind} ${peers.length}개 중 ${me.users.place}위예요 (1위 ${peers[0].name} ${fmtVisits(peers[0].users!.visits)} 번).`);
      }
    }
  }
  return out;
}
