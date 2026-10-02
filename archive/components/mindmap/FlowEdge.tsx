"use client";

import { getBezierPath, type Edge, type EdgeProps } from "@xyflow/react";
import { memo } from "react";

export type FlowEdgeData = { accent: string; opacity: number; active: boolean; seed: number };
export type FlowEdgeType = Edge<FlowEdgeData, "flow">;

/** Neon bezier with a pulse of light travelling from parent to child. */
export const FlowEdge = memo(function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<FlowEdgeType>) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.45 });
  const accent = data?.accent ?? "#fff";
  const o = data?.opacity ?? 1;
  const active = data?.active ?? false;
  return (
    <g style={{ opacity: o }}>
      <path d={path} fill="none" stroke={accent} strokeOpacity={active ? 0.22 : 0.08} strokeWidth={active ? 10 : 7} />
      <path id={id} d={path} fill="none" stroke={accent} strokeOpacity={active ? 0.95 : 0.45} strokeWidth={active ? 2 : 1.3} />
      <path
        d={path}
        fill="none"
        pathLength={100}
        className="edge-flow"
        stroke="#fff"
        strokeWidth={active ? 2.6 : 2}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 4px ${accent}) drop-shadow(0 0 8px ${accent})`,
          animationDelay: `${-(data?.seed ?? 0) * 0.37}s`,
          animationDuration: active ? "1.4s" : undefined,
        }}
      />
    </g>
  );
});

export const edgeTypes = { flow: FlowEdge };
