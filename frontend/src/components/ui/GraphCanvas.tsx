import React, { useMemo } from 'react';
import type { Hunt } from '../../types';

export interface GraphCanvasProps {
  hunt: Hunt;
  mode?: 'preview' | 'comparison' | 'analysis';
  actualRouteNodes?: string[];
  className?: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  hunt,
  mode = 'preview',
  actualRouteNodes = [],
  className = '',
}) => {
  const layout = useMemo(() => {
    const total = hunt.locations.length;
    const width = 560;
    const height = 320;
    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = 118;

    const posMap: Record<string, { x: number; y: number; loc: any; idx: number }> = {};
    hunt.locations.forEach((loc, idx) => {
      const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
      const r = total > 10 && idx % 2 === 1 ? outerRadius * 0.56 : outerRadius;
      posMap[loc.node_id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        loc,
        idx,
      };
    });

    const optPath: string[] = hunt.analysis_data?.dijkstra_path || [];
    const optEdges = new Set<string>();
    for (let i = 0; i < optPath.length - 1; i++) {
      optEdges.add(`${optPath[i]}-${optPath[i + 1]}`);
      optEdges.add(`${optPath[i + 1]}-${optPath[i]}`);
    }

    const playerEdges = new Set<string>();
    for (let i = 0; i < actualRouteNodes.length - 1; i++) {
      playerEdges.add(`${actualRouteNodes[i]}-${actualRouteNodes[i + 1]}`);
      playerEdges.add(`${actualRouteNodes[i + 1]}-${actualRouteNodes[i]}`);
    }

    const edges = hunt.edges
      .map((e) => {
        const from = posMap[e.from_node];
        const to = posMap[e.to_node];
        if (!from || !to) return null;
        const key = `${e.from_node}-${e.to_node}`;
        return {
          ...e,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          isOptimal: optEdges.has(key),
          isPlayer: playerEdges.has(key),
        };
      })
      .filter(Boolean) as any[];

    return { nodes: Object.values(posMap), edges, optPath };
  }, [hunt, actualRouteNodes]);

  return (
    <div className={`bg-[#0E0E12] border border-white/[0.06] rounded-xl p-4 ${className}`}>
      <svg viewBox="0 0 560 320" className="w-full max-h-[290px] select-none">
        {layout.edges.map((e) => {
          let stroke = 'rgba(255, 255, 255, 0.1)';
          let strokeWidth = 1.25;

          if (mode === 'comparison') {
            if (e.isOptimal) {
              stroke = '#E5A93C';
              strokeWidth = 2.5;
            } else if (e.isPlayer) {
              stroke = '#529CCA';
              strokeWidth = 2;
            }
          }

          return (
            <line
              key={e.id}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          );
        })}

        {layout.nodes.map(({ x, y, loc, idx }) => {
          const isStart = loc.is_start;
          const isTreasure = loc.is_treasure;
          const inOptimal = layout.optPath.includes(loc.node_id);
          const inPlayer = actualRouteNodes.includes(loc.node_id);

          let fill = '#181820';
          let stroke = 'rgba(255,255,255,0.22)';

          if (isStart) {
            fill = '#30A46C';
            stroke = '#30A46C';
          } else if (isTreasure) {
            fill = '#E5A93C';
            stroke = '#E5A93C';
          } else if (mode === 'comparison' && inOptimal) {
            fill = '#3A2A10';
            stroke = '#E5A93C';
          } else if (mode === 'comparison' && inPlayer) {
            fill = '#132838';
            stroke = '#529CCA';
          }

          const label =
            mode === 'preview' && !isStart && !isTreasure
              ? `${idx + 1}`
              : loc.name.length > 14
              ? loc.name.slice(0, 12) + '…'
              : loc.name;

          return (
            <g key={loc.node_id} transform={`translate(${x}, ${y})`}>
              <circle
                r={isStart || isTreasure ? 9 : 6.5}
                fill={fill}
                stroke={stroke}
                strokeWidth="1.75"
              />
              <text
                y={isStart || isTreasure ? 20 : 18}
                textAnchor="middle"
                fill={isStart ? '#6EE7B7' : isTreasure ? '#F6D58E' : '#8E8E99'}
                fontSize="9.5"
                fontFamily="Inter, sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-[#8E8E99]">
        {mode === 'comparison' ? (
          <>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-[#E5A93C] inline-block" /> Optimal Route
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-[#529CCA] inline-block" /> Your Path
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30A46C] inline-block" /> Entrance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E5A93C] inline-block" /> Vault
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white/25 inline-block" /> Chamber
            </span>
          </>
        )}
      </div>
    </div>
  );
};
