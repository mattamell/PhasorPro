import { getPhasorUnit, getScaledMag, polarToXY } from "../utils/phasorMath.js";

const SIZE = 760;
const CENTER = SIZE / 2;
const PADDING = 70;
const RADIAL_DIVISIONS = 6;

function toScreen(x, y, scale) {
  return {
    sx: CENTER + x * scale,
    sy: CENTER - y * scale,
  };
}

function getTipToTailPoints(group, scales) {
  let current = { x: 0, y: 0 };
  const segments = group.vectors.map((vector) => {
    const scaledMag = getScaledMag(vector, scales);
    const delta = polarToXY(scaledMag, Number(vector.angle));
    const start = current;
    const end = {
      x: current.x + delta.x,
      y: current.y + delta.y,
    };
    current = end;
    return { vector, start, end };
  });

  return { segments, end: current };
}

function getTipToTailMaxMag(groups, scales) {
  return Math.max(
    ...groups.flatMap((group) => {
      const points = getTipToTailPoints(group, scales);
      return points.segments.map(({ end }) => Math.sqrt(end.x * end.x + end.y * end.y));
    }),
    1,
  );
}

export default function PhasorDiagram({
  phasors,
  scales,
  showGrid,
  showDiagramLabels,
  lineThickness,
  arrowSize,
  unitsPerDivision,
  autoMaxMag,
  tipToTailGroups = [],
  svgRef,
}) {
  const fixedUnitsPerDivision = Number(unitsPerDivision) || 0;
  const visiblePhasors = phasors.filter((phasor) => phasor.visible !== false);
  const dynamicMaxMag = Math.max(...visiblePhasors.map((p) => getScaledMag(p, scales)), 1);
  const autoScaleMaxMag = Number(autoMaxMag) || 0;
  const tipToTailMaxMag = getTipToTailMaxMag(tipToTailGroups, scales);
  const maxMag =
    fixedUnitsPerDivision > 0
      ? fixedUnitsPerDivision * RADIAL_DIVISIONS
      : Math.max(dynamicMaxMag, autoScaleMaxMag, tipToTailMaxMag);
  const scale = (SIZE / 2 - PADDING) / maxMag;

  return (
    <svg ref={svgRef} id="phasorSvg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {showGrid && (
        <>
          {Array.from({ length: RADIAL_DIVISIONS }, (_, index) => {
            const r = ((index + 1) * maxMag) / RADIAL_DIVISIONS;
            const labelPoint = toScreen(r, 0, scale);
            return (
              <g key={`radius-${index}`}>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={r * scale}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={labelPoint.sx + 4} y={labelPoint.sy - 4} fontSize="11" fill="#64748b">
                  {r.toFixed(0)}
                </text>
              </g>
            );
          })}

          {Array.from({ length: 12 }, (_, index) => index * 30).map((angle) => {
            const end = polarToXY(maxMag * 1.08, angle);
            const endScreen = toScreen(end.x, end.y, scale);
            const label = polarToXY(maxMag * 1.17, angle);
            const labelScreen = toScreen(label.x, label.y, scale);
            return (
              <g key={`angle-${angle}`}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={endScreen.sx}
                  y2={endScreen.sy}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                />
                <text
                  x={labelScreen.sx}
                  y={labelScreen.sy}
                  fontSize="11"
                  fill="#64748b"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {angle}&deg;
                </text>
              </g>
            );
          })}
        </>
      )}

      <line x1="0" y1={CENTER} x2={SIZE} y2={CENTER} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={CENTER} y1="0" x2={CENTER} y2={SIZE} stroke="#94a3b8" strokeWidth="1.5" />

      <defs>
        {phasors.map((p, index) => (
          <marker
            key={`arrow-${index}`}
            id={`arrow-${index}`}
            markerWidth={arrowSize}
            markerHeight={arrowSize}
            refX={arrowSize * 0.8}
            refY={arrowSize * 0.3}
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path
              d={`M0,0 L0,${arrowSize * 0.6} L${arrowSize * 0.9},${arrowSize * 0.3} z`}
              fill={p.color}
            />
          </marker>
        ))}
        {tipToTailGroups.flatMap((group, groupIndex) =>
          group.vectors.map((vector, vectorIndex) => (
            <marker
              key={`tip-arrow-${group.id}-${vectorIndex}`}
              id={`tip-arrow-${groupIndex}-${vectorIndex}`}
              markerWidth={arrowSize}
              markerHeight={arrowSize}
              refX={arrowSize * 0.8}
              refY={arrowSize * 0.3}
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d={`M0,0 L0,${arrowSize * 0.6} L${arrowSize * 0.9},${arrowSize * 0.3} z`}
                fill={vector.color}
              />
            </marker>
          )),
        )}
      </defs>

      {tipToTailGroups.map((group, groupIndex) => {
        const points = getTipToTailPoints(group, scales);
        const endScreen = toScreen(points.end.x, points.end.y, scale);

        return (
          <g key={group.id} className="tip-to-tail-group">
            {points.segments.map(({ vector, start, end }, vectorIndex) => {
              const startScreen = toScreen(start.x, start.y, scale);
              const endSegmentScreen = toScreen(end.x, end.y, scale);
              const midScreen = toScreen((start.x + end.x) / 2, (start.y + end.y) / 2, scale);

              return (
                <g key={`${group.id}-${vector.label}-${vectorIndex}`}>
                  <line
                    x1={startScreen.sx}
                    y1={startScreen.sy}
                    x2={endSegmentScreen.sx}
                    y2={endSegmentScreen.sy}
                    stroke={vector.color}
                    strokeWidth={Math.max(1.5, lineThickness * 0.75)}
                    strokeDasharray="7 5"
                    opacity="0.82"
                    markerEnd={`url(#tip-arrow-${groupIndex}-${vectorIndex})`}
                  />
                  <circle cx={startScreen.sx} cy={startScreen.sy} r="3" fill="#ffffff" stroke={vector.color} />
                  {showDiagramLabels && (
                    <text
                      x={midScreen.sx}
                      y={midScreen.sy - 8}
                      fontSize="11"
                      fill={vector.color}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="diagram-label"
                    >
                      {vector.label}
                    </text>
                  )}
                </g>
              );
            })}
            <line
              x1={CENTER}
              y1={CENTER}
              x2={endScreen.sx}
              y2={endScreen.sy}
              stroke={group.color}
              strokeWidth="2"
              strokeDasharray="3 4"
              opacity="0.75"
            />
            <circle cx={endScreen.sx} cy={endScreen.sy} r="4" fill={group.color} />
            {showDiagramLabels && (
              <text
                x={endScreen.sx + 18}
                y={endScreen.sy - 14}
                fontSize="12"
                fill={group.color}
                textAnchor="middle"
                dominantBaseline="middle"
                className="diagram-label"
              >
                {group.label}
              </text>
            )}
          </g>
        );
      })}

      {phasors.map((p, index) => {
        if (!p.visible) return null;
        const scaledMag = getScaledMag(p, scales);
        const end = polarToXY(scaledMag, Number(p.angle));
        const screen = toScreen(end.x, end.y, scale);
        const unit = getPhasorUnit(p, scales);

        return (
          <g key={`${p.label}-${index}`}>
            <line
              x1={CENTER}
              y1={CENTER}
              x2={screen.sx}
              y2={screen.sy}
              stroke={p.color}
              strokeWidth={lineThickness}
              markerEnd={`url(#arrow-${index})`}
            />
            {showDiagramLabels && (
              <text
                x={screen.sx + (Number(p.labelX) || 0)}
                y={screen.sy + (Number(p.labelY) || 0)}
                fontSize="14"
                fill={p.color}
                textAnchor="middle"
                dominantBaseline="middle"
                className="diagram-label"
              >
                {p.label} {p.mag}
                {unit}&ang;{p.angle}&deg;
              </text>
            )}
          </g>
        );
      })}

      <circle cx={CENTER} cy={CENTER} r="4" fill="#111827" />
    </svg>
  );
}
