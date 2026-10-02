import dagre from "@dagrejs/dagre";
import { ARCHIVE, TOOLS, type Category, type SubField, type ToolEntry, type ToolInfo, type ToolKey } from "@/data/archive";

export type NodeKind = "root" | "field" | "tool";

export interface GNode {
  id: string;
  parent: string | null;
  kind: NodeKind;
  label: string;
  labelEn: string;
  children: string[];
  field?: SubField;
  entry?: ToolEntry;
  tool?: ToolInfo;
}

export type Graph = Map<string, GNode>;

export const NODE_SIZE: Record<NodeKind, { w: number; h: number }> = {
  root: { w: 232, h: 88 },
  field: { w: 240, h: 76 },
  tool: { w: 280, h: 96 },
};

export const fieldId = (slug: string, fieldKey: string) => `${slug}/${fieldKey}`;
export const toolId = (slug: string, fieldKey: string, key: ToolKey) => `${slug}/${fieldKey}/${key}`;

export function buildGraph(c: Category): Graph {
  const g: Graph = new Map();
  g.set(c.slug, { id: c.slug, parent: null, kind: "root", label: c.name, labelEn: c.nameEn, children: [] });
  for (const f of c.fields) {
    const fid = fieldId(c.slug, f.id);
    g.get(c.slug)!.children.push(fid);
    g.set(fid, { id: fid, parent: c.slug, kind: "field", label: f.name, labelEn: f.nameEn, children: [], field: f });
    for (const e of f.tools) {
      const tid = toolId(c.slug, f.id, e.tool);
      g.get(fid)!.children.push(tid);
      const tool = TOOLS[e.tool];
      g.set(tid, { id: tid, parent: fid, kind: "tool", label: tool.name, labelEn: tool.name, children: [], field: f, entry: e, tool });
    }
  }
  return g;
}

/** Nodes that should be on screen: root + children of every expanded node whose ancestors are all expanded. */
export function visibleIds(g: Graph, rootId: string, expanded: Set<string>): string[] {
  const out: string[] = [];
  const walk = (id: string) => {
    out.push(id);
    if (!expanded.has(id)) return;
    for (const c of g.get(id)!.children) walk(c);
  };
  walk(rootId);
  return out;
}

export function ancestors(g: Graph, id: string): string[] {
  const out: string[] = [];
  let p = g.get(id)?.parent ?? null;
  while (p) {
    out.unshift(p);
    p = g.get(p)?.parent ?? null;
  }
  return out;
}

export type Pos = { x: number; y: number };

/** Horizontal (left → right) tidy tree via dagre. Returns top-left positions. */
export function layoutTree(g: Graph, ids: string[]): Map<string, Pos> {
  const d = new dagre.graphlib.Graph();
  d.setGraph({ rankdir: "LR", ranksep: 110, nodesep: 18, marginx: 0, marginy: 0 });
  d.setDefaultEdgeLabel(() => ({}));
  const set = new Set(ids);
  for (const id of ids) {
    const { w, h } = NODE_SIZE[g.get(id)!.kind];
    d.setNode(id, { width: w, height: h });
  }
  for (const id of ids) {
    const p = g.get(id)!.parent;
    if (p && set.has(p)) d.setEdge(p, id);
  }
  // Keep siblings in data order (top → bottom). `ids` is already DFS order, so
  // chaining consecutive nodes of each depth yields the intended ordering.
  const byDepth = new Map<number, string[]>();
  for (const id of ids) {
    const depth = ancestors(g, id).length;
    byDepth.set(depth, [...(byDepth.get(depth) ?? []), id]);
  }
  const constraints = [...byDepth.values()].flatMap((seq) => seq.slice(1).map((right, i) => ({ left: seq[i], right })));
  dagre.layout(d, { constraints });
  const out = new Map<string, Pos>();
  for (const id of ids) {
    const n = d.node(id);
    const { w, h } = NODE_SIZE[g.get(id)!.kind];
    out.set(id, { x: n.x - w / 2, y: n.y - h / 2 });
  }
  return out;
}

/** Every place a tool appears across the whole archive. */
export function toolOccurrences(key: ToolKey) {
  return ARCHIVE.flatMap((c) =>
    c.fields.filter((f) => f.tools.some((t) => t.tool === key)).map((f) => ({ category: c, field: f, nodeId: toolId(c.slug, f.id, key) })),
  );
}

export function monogram(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return name.length <= 2 ? name : name[0].toUpperCase();
}
