import { complexToPolar, degToRad } from "./complexMath.js";

export function polarToXY(mag, angleDeg) {
  const a = degToRad(angleDeg);
  return {
    x: mag * Math.cos(a),
    y: mag * Math.sin(a),
  };
}

export function getScale(scales, scaleKey) {
  return scales.find((s) => s.key === scaleKey) || scales[0];
}

export function getPhasorUnit(phasor, scales) {
  return phasor.unit || getScale(scales, phasor.scaleKey)?.unit || "";
}

export function getScaledMag(phasor, scales) {
  const scale = getScale(scales, phasor.scaleKey);
  return (Number(phasor.mag) || 0) * (Number(scale?.ratio) || 1);
}

export function inferScaleKey(label) {
  const clean = String(label || "").trim().toUpperCase();

  if (clean.startsWith("I")) return "current";
  if (clean.startsWith("Z")) return "impedance";
  if (clean.startsWith("S") || clean.startsWith("P") || clean.startsWith("Q")) return "power";
  if (clean.startsWith("V") || clean.startsWith("E")) return "voltage";

  return "voltage";
}

export function makePhasor(label, value, color, scaleKey, expanded = false, options = {}) {
  const polar = complexToPolar(value);
  return {
    label,
    mag: Number(polar.mag.toFixed(3)),
    angle: Number(polar.angle.toFixed(3)),
    color,
    visible: options.visible ?? true,
    labelX: 16,
    labelY: -12,
    scaleKey,
    expanded,
    ...options,
  };
}

export function normalizeDegrees(deg) {
  return ((deg + 180) % 360 + 360) % 360 - 180;
}

export function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

export function getCursorTimeSeconds(angleDeg, frequency, cursorMode, cycleOffset = 0) {
  const theta = degToRad(Number(angleDeg) || 0);
  let target;

  if (cursorMode === "max") target = Math.PI / 2;
  else if (cursorMode === "min") target = (3 * Math.PI) / 2;
  else target = 0;

  const omega = 2 * Math.PI * frequency;
  const baseTime = positiveModulo(target - theta, 2 * Math.PI) / omega;
  return baseTime + cycleOffset * (1 / frequency);
}

export function getNearestCursorTimeSeconds(angleDeg, frequency, cursorMode, referenceTime) {
  const period = 1 / frequency;
  const baseTime = getCursorTimeSeconds(angleDeg, frequency, cursorMode, 0);
  const cycle = Math.round((referenceTime - baseTime) / period);
  return baseTime + cycle * period;
}

export function getCursorLabel(cursorMode) {
  if (cursorMode === "max") return "Maximum";
  if (cursorMode === "min") return "Minimum";
  return "Zero rising";
}
