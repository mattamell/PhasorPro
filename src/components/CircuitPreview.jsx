export default function CircuitPreview({ circuit }) {
  const branchCount = Math.max(circuit.branches.length, 1);
  const maxZCount = Math.max(...circuit.branches.map((b) => b.impedances.length), 1);
  const width = Math.max(760, 320 + maxZCount * 120);
  const branchSpacing = 82;
  const height = Math.max(260, 135 + branchCount * branchSpacing);

  const sourceX = 78;
  const leftRailX = 170;
  const rightRailX = width - 96;
  const topY = 70;
  const bottomY = topY + (branchCount - 1) * branchSpacing;
  const sourceY = (topY + bottomY) / 2;
  const groundY = bottomY + 62;

  return (
    <svg id="circuitSvg" viewBox={`0 0 ${width} ${height}`}>
      <circle cx={sourceX} cy={sourceY} r="26" fill="#ffffff" stroke="#334155" strokeWidth="2" />
      <text x={sourceX} y={sourceY - 4} className="schematic-text">
        Vs
      </text>
      <text x={sourceX} y={sourceY + 13} className="schematic-small">
        {circuit.sourceMag}&ang;{circuit.sourceAngle}&deg;
      </text>

      <line x1={sourceX + 26} y1={sourceY} x2={leftRailX} y2={sourceY} className="wire" />
      <line x1={sourceX} y1={sourceY + 26} x2={sourceX} y2={groundY} className="wire" />
      <line x1={sourceX} y1={groundY} x2={rightRailX} y2={groundY} className="wire ground-bus" />
      <line x1={leftRailX} y1={topY} x2={leftRailX} y2={bottomY} className="wire" />
      <line x1={rightRailX} y1={topY} x2={rightRailX} y2={groundY - 18} className="wire ground-rail" />
      <line x1={rightRailX} y1={groundY - 18} x2={rightRailX} y2={groundY} className="wire" />
      <GroundSymbol x={rightRailX} y={groundY} />
      <text x={rightRailX + 36} y={groundY + 2} className="schematic-small">
        GND
      </text>

      {circuit.branches.map((branch, branchIndex) => {
        const y = topY + branchIndex * branchSpacing;
        const zStartX = leftRailX + 45;
        const zGap = 112;
        const boxW = 74;
        const boxH = 38;
        const lastBoxEndX = zStartX + (branch.impedances.length - 1) * zGap + boxW;

        return (
          <g key={branch.name}>
            <line x1={leftRailX} y1={y} x2={zStartX} y2={y} className="wire" />
            <text x={leftRailX - 24} y={y} className="schematic-small">
              B{branchIndex + 1}
            </text>

            {branch.impedances.map((z, zIndex) => {
              const x = zStartX + zIndex * zGap;
              const boxY = y - boxH / 2;
              const sign = Number(z.x) >= 0 ? "+" : "\u2212";

              return (
                <g key={`${z.label}-${zIndex}`}>
                  {zIndex > 0 && (
                    <line x1={x - zGap + boxW} y1={y} x2={x} y2={y} className="wire" />
                  )}
                  <rect x={x} y={boxY} width={boxW} height={boxH} rx="8" className="z-box" />
                  <text x={x + boxW / 2} y={y - 6} className="schematic-text">
                    {z.label}
                  </text>
                  <text x={x + boxW / 2} y={y + 10} className="schematic-small">
                    {z.r} {sign} j{Math.abs(Number(z.x) || 0)}
                  </text>
                </g>
              );
            })}

            <line x1={lastBoxEndX} y1={y} x2={rightRailX} y2={y} className="wire" />
          </g>
        );
      })}
    </svg>
  );
}

function GroundSymbol({ x, y }) {
  return (
    <g className="ground-symbol">
      <line x1={x - 18} y1={y} x2={x + 18} y2={y} />
      <line x1={x - 12} y1={y + 8} x2={x + 12} y2={y + 8} />
      <line x1={x - 6} y1={y + 16} x2={x + 6} y2={y + 16} />
    </g>
  );
}
