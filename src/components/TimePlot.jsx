import { useState } from "react";
import MeasurementTable from "./MeasurementTable.jsx";
import DragNumberInput from "./DragNumberInput.jsx";
import { degToRad } from "../utils/complexMath.js";
import {
  getCursorLabel,
  getNearestCursorTimeSeconds,
  getCursorTimeSeconds,
  getPhasorUnit,
  getScaledMag,
  normalizeDegrees,
} from "../utils/phasorMath.js";

const WIDTH = 760;
const HEIGHT = 300;
const LEFT = 58;
const RIGHT = 24;
const TOP = 24;
const BOTTOM = 46;
const VERTICAL_DIVISIONS_FROM_CENTER = 2;
const TIME_DOMAIN_SCALE_KEYS = new Set(["voltage", "current"]);

function formatAxisValue(value) {
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export default function TimePlot({
  phasors,
  scales,
  settings,
  colorPickerMode,
  colorPalette,
  onSettingsChange,
  onPhasorColorChange,
  onPrevCursorCycle,
  onNextCursorCycle,
}) {
  const [selectedWaveLabel, setSelectedWaveLabel] = useState("");
  const visible = phasors.filter((p) => p.visible && TIME_DOMAIN_SCALE_KEYS.has(p.scaleKey));
  const hiddenWaveLabels = Array.isArray(settings.hiddenWaveLabels) ? settings.hiddenWaveLabels : [];
  const timeVisible = visible.filter((p) => !hiddenWaveLabels.includes(p.label));
  const referenceOptions = timeVisible.map((p) => p.label);
  const selectedReference = referenceOptions.includes(settings.referenceLabel)
    ? settings.referenceLabel
    : referenceOptions[0] || "";

  const frequency = Number(settings.frequency) || 60;
  const cycles = Number(settings.cycles) || 1;
  const cursorMode = settings.cursorMode;
  const period = 1 / frequency;
  const totalTime = period * cycles;
  const plotW = WIDTH - LEFT - RIGHT;
  const plotH = HEIGHT - TOP - BOTTOM;
  const midY = TOP + plotH / 2;
  const reference = timeVisible.find((p) => p.label === selectedReference) || timeVisible[0];
  const maxCursorCycle = Math.max(Math.ceil(cycles) - 1, 0);
  const cursorCycleOffset = Math.max(0, Math.min(settings.cursorCycleOffset, maxCursorCycle));
  const referenceCursorTime = reference
    ? getCursorTimeSeconds(reference.angle, frequency, cursorMode, cursorCycleOffset)
    : 0;
  const maxAmp = Math.max(...timeVisible.map((p) => getScaledMag(p, scales)), 1);
  const fixedUnitsPerDivision = Number(settings.valueUnitsPerDivision) || 0;
  const usingFixedValueScale = fixedUnitsPerDivision > 0;
  const yLimit = usingFixedValueScale
    ? fixedUnitsPerDivision * VERTICAL_DIVISIONS_FROM_CENTER
    : maxAmp;
  const unitsPerDivision = yLimit / VERTICAL_DIVISIONS_FROM_CENTER;
  const yScale = (plotH / 2) / yLimit;

  function tx(t) {
    return LEFT + (t / totalTime) * plotW;
  }

  function ty(v) {
    return midY - v * yScale;
  }

  function toggleWave(label) {
    const currentlyHidden = hiddenWaveLabels.includes(label);
    onSettingsChange({
      hiddenWaveLabels: currentlyHidden
        ? hiddenWaveLabels.filter((item) => item !== label)
        : [...hiddenWaveLabels, label],
    });
  }

  const measurements = visible.map((p, index) => {
    const shownInTimePlot = !hiddenWaveLabels.includes(p.label);
    const measuredCursorTime = getNearestCursorTimeSeconds(
      p.angle,
      frequency,
      cursorMode,
      referenceCursorTime,
    );
    const dt = measuredCursorTime - referenceCursorTime;
    const phaseFromRef = reference ? normalizeDegrees(Number(p.angle) - Number(reference.angle)) : 0;
    const unit = getPhasorUnit(p, scales);

    return {
      key: `${p.label}-${index}`,
      label: p.label,
      color: p.color,
      selected: selectedWaveLabel === p.label,
      shownInTimePlot,
      valueText: `${p.mag}${unit}\u2220${p.angle}\u00b0`,
      cursorText: `${getCursorLabel(cursorMode)} / cycle ${cursorCycleOffset + 1}`,
      timeText: `${(measuredCursorTime * 1000).toFixed(3)} ms`,
      deltaText: `${(dt * 1000).toFixed(3)} ms`,
      phaseText: `${phaseFromRef.toFixed(2)}\u00b0`,
    };
  });

  return (
    <div>
      <div className="plot-title-row">
        <span>Time-Based View</span>
        <div className="plot-options">
          <label>
            <input
              type="checkbox"
              checked={settings.showTimePlot}
              onChange={(e) => onSettingsChange({ showTimePlot: e.target.checked })}
            />
            Show
          </label>
          <label>
            Frequency
            <DragNumberInput
              value={settings.frequency}
              step="any"
              dragStep={1}
              onChange={(e) => onSettingsChange({ frequency: e.target.value })}
            />{" "}
            Hz
          </label>
          <label>
            Cycles
            <DragNumberInput
              value={settings.cycles}
              min="0.25"
              step="0.25"
              dragStep={0.25}
              onChange={(e) => onSettingsChange({ cycles: e.target.value })}
            />
          </label>
          <label>
            Units/div
            <DragNumberInput
              value={settings.valueUnitsPerDivision ?? ""}
              min="0"
              step="any"
              dragStep={1}
              placeholder="Auto"
              onChange={(e) => onSettingsChange({ valueUnitsPerDivision: e.target.value })}
            />
          </label>
          <label>
            Cursor point
            <select value={cursorMode} onChange={(e) => onSettingsChange({ cursorMode: e.target.value })}>
              <option value="zeroRising">Zero rising</option>
              <option value="max">Maximum</option>
              <option value="min">Minimum</option>
            </select>
          </label>
          <label>
            Reference
            <select
              value={selectedReference}
              onChange={(e) => onSettingsChange({ referenceLabel: e.target.value })}
            >
              {referenceOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cursor cycle
            <button type="button" className="collapse-button" onClick={onPrevCursorCycle}>
              Prev
            </button>
            <button type="button" className="collapse-button" onClick={() => onNextCursorCycle(maxCursorCycle)}>
              Next
            </button>
          </label>
        </div>
      </div>

      {settings.showTimePlot && (
        <svg id="timeSvg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          <defs>
            <clipPath id="time-plot-clip">
              <rect x={LEFT} y={TOP} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {Array.from({ length: 9 }, (_, i) => {
            const x = LEFT + (i / 8) * plotW;
            return <line key={`vgrid-${i}`} x1={x} y1={TOP} x2={x} y2={TOP + plotH} stroke="#e5e7eb" />;
          })}

          {[-2, -1, 0, 1, 2].map((i) => {
            const y = midY - (i / 2) * (plotH / 2);
            return (
              <g key={`hgrid-${i}`}>
                <line
                  x1={LEFT}
                  y1={y}
                  x2={LEFT + plotW}
                  y2={y}
                  stroke={i === 0 ? "#94a3b8" : "#e5e7eb"}
                  strokeWidth={i === 0 ? 1.5 : 1}
                />
                <text x="8" y={y + 4} fontSize="11" fill="#64748b">
                  {formatAxisValue(i * unitsPerDivision)}
                </text>
              </g>
            );
          })}

          <line x1={LEFT} y1={TOP} x2={LEFT} y2={TOP + plotH} stroke="#94a3b8" strokeWidth="1.5" />
          <line x1={LEFT} y1={midY} x2={LEFT + plotW} y2={midY} stroke="#94a3b8" strokeWidth="1.5" />
          <text x={LEFT + plotW} y={HEIGHT - 14} fontSize="11" fill="#64748b" textAnchor="end">
            {(totalTime * 1000).toFixed(2)} ms
          </text>
          <text x={LEFT} y={HEIGHT - 14} fontSize="11" fill="#64748b">
            0 ms
          </text>
          <text x={LEFT + plotW} y={TOP + 14} fontSize="11" fill="#64748b" textAnchor="end">
            {usingFixedValueScale ? `${formatAxisValue(unitsPerDivision)} units/div` : "Auto scale"}
          </text>

          <g clipPath="url(#time-plot-clip)">
            {timeVisible.map((p, index) => {
              const scaledMag = getScaledMag(p, scales);
              const samples = 500;
              const points = Array.from({ length: samples + 1 }, (_, i) => {
                const t = (i / samples) * totalTime;
                const phase = degToRad(Number(p.angle) || 0);
                const value = scaledMag * Math.sin(2 * Math.PI * frequency * t + phase);
                return `${tx(t).toFixed(2)},${ty(value).toFixed(2)}`;
              }).join(" ");
              const measuredCursorTime = getNearestCursorTimeSeconds(
                p.angle,
                frequency,
                cursorMode,
                referenceCursorTime,
              );
              const visibleCursorTime = getCursorTimeSeconds(p.angle, frequency, cursorMode, cursorCycleOffset);
              const cursorTime =
                measuredCursorTime >= 0 && measuredCursorTime <= totalTime
                  ? measuredCursorTime
                  : visibleCursorTime;
              let cursorValue = 0;
              if (cursorMode === "max") cursorValue = scaledMag;
              if (cursorMode === "min") cursorValue = -scaledMag;
              const cursorX = tx(cursorTime);
              const cursorY = ty(cursorValue);

              return (
                <g key={`${p.label}-${index}`}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={selectedWaveLabel === p.label ? 4 : 2}
                  strokeLinecap="round"
                  className="time-wave-line"
                  onClick={() => setSelectedWaveLabel(p.label)}
                />
                {cursorTime <= totalTime && (
                  <>
                    <line
                      x1={cursorX}
                      y1={TOP}
                      x2={cursorX}
                      y2={TOP + plotH}
                      stroke={p.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.8"
                    />
                    <circle cx={cursorX} cy={cursorY} r="4" fill={p.color} />
                  </>
                )}
              </g>
              );
            })}
          </g>
        </svg>
      )}

      <MeasurementTable
        measurements={measurements}
        show={settings.showTimePlot}
        onToggleWave={toggleWave}
        onWaveColorChange={onPhasorColorChange}
        onSelectWave={setSelectedWaveLabel}
        colorPickerMode={colorPickerMode}
        colorPalette={colorPalette}
      />
      {settings.showTimePlot && (
        <p className="cursor-note">
          Cursor points are fixed to a meaningful point on each wave. This keeps the view simple:
          compare when each wave crosses zero rising, reaches maximum, or reaches minimum.
        </p>
      )}
    </div>
  );
}
