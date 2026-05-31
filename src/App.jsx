import { useEffect, useMemo, useRef, useState } from "react";
import ReactGridLayout, { WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import PhasorDiagram from "./components/PhasorDiagram.jsx";
import TimePlot from "./components/TimePlot.jsx";
import PhasorPanel from "./components/PhasorPanel.jsx";
import TopMenu from "./components/TopMenu.jsx";
import CircuitPreview from "./components/CircuitPreview.jsx";
import CircuitBuilder from "./components/CircuitBuilder.jsx";
import DashboardPanel from "./components/DashboardPanel.jsx";
import AutomationPanel from "./components/AutomationPanel.jsx";
import { solveCircuit } from "./utils/circuitSolver.js";
import { getScaledMag, inferScaleKey, makePhasor } from "./utils/phasorMath.js";
import defaultLayoutProject from "../Default Layout.json";

const STORAGE_KEY = "phasor-pro-project-v1";
const GridLayout = WidthProvider(ReactGridLayout);
const DASHBOARD_MIN_COLS = 12;
const DASHBOARD_COLUMN_WIDTH = 112;
const DASHBOARD_ROW_HEIGHT = 74;
const DASHBOARD_MARGIN = [16, 16];
const DASHBOARD_PADDING = [8, 8];
const DASHBOARD_MIN_ROWS = 10;
const CIRCUIT_DASHBOARD_PANEL_IDS = ["circuit-preview", "circuit-builder", "automations"];

const colorOptions = [
  "#111827",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#7c3aed",
  "#ea580c",
  "#92400e",
  "#c026d3",
  "#0891b2",
  "#991b1b",
];

const contrastPalette = colorOptions;

const defaultScales = [
  { key: "voltage", name: "Voltage", unit: "V", ratio: 1 },
  { key: "current", name: "Current", unit: "A", ratio: 20 },
  { key: "impedance", name: "Impedance", unit: "\u03a9", ratio: 2 },
  { key: "power", name: "Power", unit: "VA", ratio: 0.5 },
];

const defaultCircuit = {
  sourceMag: 600,
  sourceAngle: 0,
  branches: [
    {
      name: "Branch 1",
      impedances: [
        { label: "Z1", r: 10, x: 5 },
        { label: "Z2", r: 20, x: -8 },
      ],
    },
    {
      name: "Branch 2",
      impedances: [{ label: "Z3", r: 30, x: 15 }],
    },
  ],
};

const defaultPhasors = [
  { label: "Vs", mag: 600, angle: 0, color: "#111827", visible: true, labelX: 16, labelY: -12, scaleKey: "voltage", expanded: true },
  { label: "V1", mag: 26.73, angle: 5.97, color: "#dc2626", visible: true, labelX: 16, labelY: -12, scaleKey: "voltage", expanded: true },
  { label: "V2", mag: 13.36, angle: -129, color: "#2563eb", visible: true, labelX: -24, labelY: 18, scaleKey: "voltage", expanded: true },
  { label: "V3", mag: 179.06, angle: 8.159, color: "#16a34a", visible: true, labelX: 16, labelY: -12, scaleKey: "voltage", expanded: true },
  { label: "V4", mag: 196.22, angle: 5.207, color: "#7c3aed", visible: true, labelX: 16, labelY: 14, scaleKey: "voltage", expanded: true },
  { label: "V5", mag: 131.75, angle: -109.62, color: "#ea580c", visible: true, labelX: -28, labelY: 18, scaleKey: "voltage", expanded: true },
  { label: "V6", mag: 263.5, angle: -4.62, color: "#92400e", visible: true, labelX: 16, labelY: 18, scaleKey: "voltage", expanded: true },
  { label: "V7", mag: 510.6, angle: 6.54, color: "#c026d3", visible: true, labelX: 18, labelY: -16, scaleKey: "voltage", expanded: true },
  { label: "V8", mag: 237.15, angle: 30.38, color: "#0891b2", visible: true, labelX: 16, labelY: -16, scaleKey: "voltage", expanded: true },
  { label: "V9", mag: 127.65, angle: -143.46, color: "#991b1b", visible: true, labelX: -28, labelY: 18, scaleKey: "voltage", expanded: true },
];

const defaultDiagramSettings = {
  showGrid: true,
  showDiagramLabels: true,
  notesView: false,
  colorPickerMode: "fine",
  lineThickness: 3,
  arrowSize: 10,
  phasorUnitsPerDivision: "",
  visibleScaleKeys: ["voltage", "current"],
  showTipToTail: false,
  tipToTailImpedance: true,
  tipToTailPower: true,
};

const defaultTimeSettings = {
  showTimePlot: true,
  frequency: 60,
  cycles: 1,
  valueUnitsPerDivision: "",
  hiddenWaveLabels: [],
  cursorMode: "zeroRising",
  referenceLabel: "",
  cursorCycleOffset: 0,
};

const defaultDashboardSettings = {
  compactType: "vertical",
};

const defaultDashboardLayout = [
  { i: "phasor-view", x: 0, y: 0, w: 6, h: 7, minW: 4, minH: 5, visible: true },
  { i: "time-plot", x: 0, y: 7, w: 6, h: 4, minW: 4, minH: 3, visible: true },
  { i: "measurements", x: 0, y: 11, w: 6, h: 3, minW: 4, minH: 2, visible: true },
  { i: "circuit-preview", x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3, visible: true },
  { i: "circuit-builder", x: 6, y: 4, w: 3, h: 7, minW: 3, minH: 4, visible: true },
  { i: "phasors", x: 9, y: 4, w: 3, h: 7, minW: 3, minH: 4, visible: true },
  { i: "automations", x: 6, y: 11, w: 6, h: 4, minW: 5, minH: 3, visible: true },
];

const dashboardPanelTitles = {
  "phasor-view": "Phasor View",
  "time-plot": "Time Plot",
  measurements: "Measurement Table",
  "circuit-preview": "Circuit Preview",
  "circuit-builder": "Circuit Builder",
  phasors: "Phasors",
  automations: "Automations",
};

function getDashboardColumnCount(width) {
  if (!Number.isFinite(width) || width <= 0) return DASHBOARD_MIN_COLS;
  const usableWidth = Math.max(0, width - DASHBOARD_PADDING[0] * 2);
  const columnTrack = DASHBOARD_COLUMN_WIDTH + DASHBOARD_MARGIN[0];
  return Math.max(DASHBOARD_MIN_COLS, Math.floor((usableWidth + DASHBOARD_MARGIN[0]) / columnTrack));
}

function getDashboardHeight(rows) {
  return (
    DASHBOARD_PADDING[1] * 2 +
    rows * DASHBOARD_ROW_HEIGHT +
    Math.max(0, rows - 1) * DASHBOARD_MARGIN[1]
  );
}

function getDashboardRowCount(height) {
  if (!Number.isFinite(height) || height <= 0) return DASHBOARD_MIN_ROWS;
  const usableHeight = Math.max(0, height - DASHBOARD_PADDING[1] * 2);
  const rowTrack = DASHBOARD_ROW_HEIGHT + DASHBOARD_MARGIN[1];
  return Math.max(DASHBOARD_MIN_ROWS, Math.floor((usableHeight + DASHBOARD_MARGIN[1]) / rowTrack));
}

function normalizeAutomations(automations) {
  if (!Array.isArray(automations)) return [];
  return automations.map((automation) => ({
    id: automation.id || createId(),
    targetKey: automation.targetKey || "",
    min: automation.min ?? 0,
    max: automation.max ?? 100,
    speed: automation.speed ?? 10,
    stepSize: automation.stepSize ?? 1,
    elapsed: Number(automation.elapsed) || 0,
    mode: automation.mode || "onceUp",
    value: automation.value ?? automation.min ?? 0,
    direction: Number(automation.direction) || 1,
    running: false,
  }));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeScales(scales) {
  if (!Array.isArray(scales)) return clone(defaultScales);
  const byKey = new Map(scales.map((scale) => [scale.key, scale]));
  const merged = defaultScales.map((scale) => ({ ...scale, ...(byKey.get(scale.key) || {}) }));
  const custom = scales.filter((scale) => scale?.key && !defaultScales.some((item) => item.key === scale.key));
  return [...merged, ...custom];
}

function normalizeDiagramSettings(settings) {
  const merged = { ...defaultDiagramSettings, ...(settings || {}) };
  const validKeys = new Set(defaultScales.map((scale) => scale.key));
  merged.visibleScaleKeys = Array.isArray(merged.visibleScaleKeys)
    ? merged.visibleScaleKeys.filter((key) => validKeys.has(key))
    : defaultDiagramSettings.visibleScaleKeys;
  if (merged.visibleScaleKeys.length === 0) merged.visibleScaleKeys = defaultDiagramSettings.visibleScaleKeys;
  return merged;
}

function normalizeDashboardLayout(layout) {
  const byId = new Map(Array.isArray(layout) ? layout.map((item) => [item.i, item]) : []);

  return defaultDashboardLayout.map((item) => {
    const saved = byId.get(item.i);
    if (!saved) return { ...item };

    const x = Number(saved.x);
    const y = Number(saved.y);
    const w = Number(saved.w);
    const h = Number(saved.h);

    return {
      ...item,
      x: Number.isFinite(x) ? Math.max(0, x) : item.x,
      y: Number.isFinite(y) ? Math.max(0, y) : item.y,
      w: Number.isFinite(w) ? Math.max(item.minW, w) : item.w,
      h: Number.isFinite(h) ? Math.max(item.minH, h) : item.h,
      visible: saved.visible !== false,
    };
  });
}

function normalizeProject(project) {
  return {
    scales: normalizeScales(project?.scales),
    manualPhasors: Array.isArray(project?.manualPhasors) ? project.manualPhasors : clone(defaultPhasors),
    circuit: project?.circuit?.branches ? project.circuit : clone(defaultCircuit),
    mode: project?.mode === "circuit" ? "circuit" : "manual",
    diagramSettings: normalizeDiagramSettings(project?.diagramSettings),
    timeSettings: { ...defaultTimeSettings, ...(project?.timeSettings || {}) },
    circuitPrefs: project?.circuitPrefs || {},
    automations: normalizeAutomations(project?.automations),
    dashboardLayout: normalizeDashboardLayout(project?.dashboardLayout),
    dashboardSettings: {
      ...defaultDashboardSettings,
      ...(project?.dashboardSettings || {}),
    },
  };
}

function readStoredProject() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeProject(JSON.parse(stored)) : normalizeProject({});
  } catch {
    return normalizeProject({});
  }
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function applyAutomationValues(circuit, updates) {
  if (updates.length === 0) return circuit;
  const byTarget = new Map(updates.map((update) => [update.targetKey, update.value]));

  return {
    ...circuit,
    branches: circuit.branches.map((branch, branchIndex) => ({
      ...branch,
      impedances: branch.impedances.map((z, zIndex) => {
        const rKey = `${branchIndex}:${zIndex}:r`;
        const xKey = `${branchIndex}:${zIndex}:x`;
        return {
          ...z,
          r: byTarget.has(rKey) ? byTarget.get(rKey) : z.r,
          x: byTarget.has(xKey) ? byTarget.get(xKey) : z.x,
        };
      }),
    })),
  };
}

function normalizedRange(minValue, maxValue) {
  const a = Number(minValue);
  const b = Number(maxValue);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { min: 0, max: 100 };
  return {
    min: Math.min(a, b),
    max: Math.max(a, b),
  };
}

function quantizeSweepValue(min, max, progress, stepSize) {
  const range = max - min;
  if (range <= 0 || stepSize <= 0) return min;
  if (progress >= 1) return max;
  if (progress <= 0) return min;

  const stepCount = Math.floor((progress * range) / stepSize);
  return Math.min(max, min + stepCount * stepSize);
}

function getMaxScaledPhasorMag(phasors, scales) {
  const visiblePhasors = phasors.filter((phasor) => phasor.visible !== false);
  return Math.max(...visiblePhasors.map((phasor) => getScaledMag(phasor, scales)), 1);
}

function withCircuitPrefs(phasors, circuitPrefs) {
  return phasors.map((phasor) => ({ ...phasor, ...(circuitPrefs[phasor.label] || {}) }));
}

function getCircuitDisplayPhasors(sourceCircuit, circuitPrefs, visibleScaleKeys) {
  return withCircuitPrefs(solveCircuit(sourceCircuit, colorOptions).phasors, circuitPrefs).filter((phasor) =>
    visibleScaleKeys.includes(phasor.scaleKey),
  );
}

function getAutomationSampleValues(automation) {
  const { min, max } = normalizedRange(automation.min, automation.max);
  const range = max - min;
  if (range <= 0) return [min];

  const values = new Set([min, max]);
  const currentValue = Number(automation.value);
  if (Number.isFinite(currentValue) && currentValue >= min && currentValue <= max) values.add(currentValue);
  if (min <= 0 && max >= 0) values.add(0);

  const stepSize = Math.abs(Number(automation.stepSize)) || 0;
  const maxSamples = 25;

  if (stepSize > 0 && Math.ceil(range / stepSize) <= maxSamples - 1) {
    for (let value = min; value <= max; value += stepSize) {
      values.add(Number(value.toFixed(4)));
    }
  } else {
    for (let index = 1; index < maxSamples - 1; index += 1) {
      values.add(Number((min + (range * index) / (maxSamples - 1)).toFixed(4)));
    }
  }

  return [...values].sort((a, b) => a - b);
}

function buildAutomationSampleUpdateSets(runningAutomations) {
  const sampleGroups = runningAutomations.map((automation) =>
    getAutomationSampleValues(automation).map((value) => ({ targetKey: automation.targetKey, value })),
  );
  const maxSets = 160;

  return sampleGroups.reduce(
    (sets, group) => {
      const nextSets = sets.flatMap((set) => group.map((update) => [...set, update]));
      if (nextSets.length <= maxSets) return nextSets;
      const stride = Math.ceil(nextSets.length / maxSets);
      return nextSets.filter((_, index) => index % stride === 0).slice(0, maxSets);
    },
    [[]],
  );
}

function getAutomationAutoMaxMag({
  circuit,
  automations,
  circuitPrefs,
  visibleScaleKeys,
  scales,
}) {
  const runningAutomations = automations.filter((automation) => automation.running && automation.targetKey);
  if (runningAutomations.length === 0) return null;

  const sampleUpdateSets = buildAutomationSampleUpdateSets(runningAutomations);
  return sampleUpdateSets.reduce((maxMag, updates) => {
    const sampledCircuit = applyAutomationValues(circuit, updates);
    const sampledPhasors = getCircuitDisplayPhasors(sampledCircuit, circuitPrefs, visibleScaleKeys);
    return Math.max(maxMag, getMaxScaledPhasorMag(sampledPhasors, scales));
  }, 1);
}

function buildTipToTailGroups(solvedCircuit, diagramSettings) {
  if (!diagramSettings.showTipToTail) return [];

  const groups = [];

  if (diagramSettings.tipToTailImpedance) {
    solvedCircuit.branchData.forEach((branch, branchIndex) => {
      const vectors = branch.componentData
        .map(({ z, zComplex }, zIndex) => ({ z, zComplex, zIndex }))
        .reverse()
        .map(({ z, zComplex, zIndex }) =>
          makePhasor(
            z.label || `Z${zIndex + 1}`,
            zComplex,
            colorOptions[(branchIndex + zIndex + 3) % colorOptions.length],
            "impedance",
          ),
        );

      if (vectors.length > 0) {
        groups.push({
          id: `z-branch-${branchIndex}`,
          label: `Series Z total B${branchIndex + 1}`,
          color: colorOptions[(branchIndex + 7) % colorOptions.length],
          vectors,
          resultant: makePhasor(`Z_B${branchIndex + 1}`, branch.zBranch, colorOptions[(branchIndex + 7) % colorOptions.length], "impedance"),
        });
      }
    });
  }

  if (diagramSettings.tipToTailPower) {
    const branchPowerVectors = solvedCircuit.branchData.map((branch, branchIndex) =>
      makePhasor(`S_B${branchIndex + 1}`, branch.sBranch, colorOptions[(branchIndex + 4) % colorOptions.length], "power", false, {
        unit: "VA",
      }),
    );

    if (branchPowerVectors.length > 0) {
      groups.push({
        id: "s-total",
        label: "Complex power total",
        color: colorOptions[5],
        vectors: branchPowerVectors,
        resultant: makePhasor("S_T", solvedCircuit.sTotal, colorOptions[5], "power", false, { unit: "VA" }),
      });
    }
  }

  return groups;
}

function createId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()}`;
}

export default function App() {
  const initialProject = useMemo(() => readStoredProject(), []);
  const [scales, setScales] = useState(initialProject.scales);
  const [manualPhasors, setManualPhasors] = useState(initialProject.manualPhasors);
  const [circuit, setCircuit] = useState(initialProject.circuit);
  const [mode, setMode] = useState(initialProject.mode);
  const [diagramSettings, setDiagramSettings] = useState(initialProject.diagramSettings);
  const [timeSettings, setTimeSettings] = useState(initialProject.timeSettings);
  const [circuitPrefs, setCircuitPrefs] = useState(initialProject.circuitPrefs);
  const [automations, setAutomations] = useState(initialProject.automations);
  const [dashboardLayout, setDashboardLayout] = useState(initialProject.dashboardLayout);
  const [dashboardSettings, setDashboardSettings] = useState(initialProject.dashboardSettings);
  const [dashboardCols, setDashboardCols] = useState(DASHBOARD_MIN_COLS);
  const [dashboardMinHeight, setDashboardMinHeight] = useState(getDashboardHeight(DASHBOARD_MIN_ROWS));
  const [selectedWaveLabel, setSelectedWaveLabel] = useState("");
  const [projectStatus, setProjectStatus] = useState("Autosave ready.");
  const dashboardWrapRef = useRef(null);
  const phasorSvgRef = useRef(null);
  const automationsRef = useRef(automations);

  const solvedCircuit = useMemo(() => solveCircuit(circuit, colorOptions), [circuit]);
  const circuitPhasors = useMemo(
    () => solvedCircuit.phasors.map((p) => ({ ...p, ...(circuitPrefs[p.label] || {}) })),
    [solvedCircuit.phasors, circuitPrefs],
  );
  const circuitVisibleScaleKeys = Array.isArray(diagramSettings.visibleScaleKeys)
    ? diagramSettings.visibleScaleKeys
    : defaultDiagramSettings.visibleScaleKeys;
  const activeCircuitPhasors = useMemo(
    () => circuitPhasors.filter((p) => circuitVisibleScaleKeys.includes(p.scaleKey)),
    [circuitPhasors, circuitVisibleScaleKeys],
  );
  const activePhasors = mode === "circuit" ? activeCircuitPhasors : manualPhasors;
  const tipToTailGroups = useMemo(
    () => (mode === "circuit" ? buildTipToTailGroups(solvedCircuit, diagramSettings) : []),
    [
      mode,
      solvedCircuit,
      diagramSettings.showTipToTail,
      diagramSettings.tipToTailImpedance,
      diagramSettings.tipToTailPower,
    ],
  );
  const runningAutomationScaleSignature = useMemo(
    () =>
      automations
        .filter((automation) => automation.running && automation.targetKey)
        .map((automation) =>
          [
            automation.id,
            automation.targetKey,
            automation.min,
            automation.max,
            automation.stepSize,
            automation.speed,
            automation.mode,
          ].join(":"),
        )
        .join("|"),
    [automations],
  );
  const automationAutoMaxMag = useMemo(() => {
    if (mode !== "circuit") return null;
    if (Number(diagramSettings.phasorUnitsPerDivision) > 0) return null;
    if (!runningAutomationScaleSignature) return null;

    return getAutomationAutoMaxMag({
      circuit,
      automations,
      circuitPrefs,
      visibleScaleKeys: circuitVisibleScaleKeys,
      scales,
    });
  }, [
    mode,
    diagramSettings.phasorUnitsPerDivision,
    runningAutomationScaleSignature,
    circuitPrefs,
    circuitVisibleScaleKeys,
    scales,
  ]);
  const automationTargets = useMemo(
    () =>
      circuit.branches.flatMap((branch, branchIndex) =>
        branch.impedances.flatMap((z, zIndex) => [
          {
            key: `${branchIndex}:${zIndex}:r`,
            label: `${branch.name} / ${z.label} R`,
            value: Number(z.r) || 0,
            field: "r",
          },
          {
            key: `${branchIndex}:${zIndex}:x`,
            label: `${branch.name} / ${z.label} X`,
            value: Number(z.x) || 0,
            field: "x",
          },
        ]),
      ),
    [circuit],
  );

  const project = useMemo(
    () => ({
      version: 1,
      scales,
      manualPhasors,
      circuit,
      mode,
      diagramSettings,
      timeSettings,
      circuitPrefs,
      automations,
      dashboardLayout,
      dashboardSettings,
    }),
    [
      scales,
      manualPhasors,
      circuit,
      mode,
      diagramSettings,
      timeSettings,
      circuitPrefs,
      automations,
      dashboardLayout,
      dashboardSettings,
    ],
  );

  useEffect(() => {
    document.body.classList.toggle("notes-view", diagramSettings.notesView);
  }, [diagramSettings.notesView]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    }, 300);
    return () => window.clearTimeout(saveTimer);
  }, [project]);

  useEffect(() => {
    automationsRef.current = automations;
  }, [automations]);

  useEffect(() => {
    const element = dashboardWrapRef.current;
    if (!element) return undefined;

    function updateColumnCount(width) {
      setDashboardCols(getDashboardColumnCount(width));
    }

    function updateMinHeight() {
      const rect = element.getBoundingClientRect();
      const availableHeight = window.innerHeight - rect.top - 12;
      setDashboardMinHeight(getDashboardHeight(getDashboardRowCount(availableHeight)));
    }

    updateColumnCount(element.clientWidth);
    updateMinHeight();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateColumnCount(entry.contentRect.width);
      updateMinHeight();
    });
    observer.observe(element);
    window.addEventListener("resize", updateMinHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMinHeight);
    };
  }, []);

  useEffect(() => {
    let frameId;
    let lastTime = performance.now();

    function tick(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const updates = [];

      if (automationsRef.current.some((automation) => automation.running)) {
        const nextAutomations = automationsRef.current.map((automation) => {
          if (!automation.running) return automation;

          const { min, max } = normalizedRange(automation.min, automation.max);
          const range = max - min;
          const durationSeconds = Math.abs(Number(automation.speed)) || 0;
          const stepSize = Math.abs(Number(automation.stepSize)) || 0;
          if (range <= 0 || durationSeconds <= 0 || stepSize <= 0) {
            updates.push({ targetKey: automation.targetKey, value: min });
            return { ...automation, value: min, elapsed: 0, running: false };
          }
          let direction = Number(automation.direction) || 1;
          if (automation.mode === "loopDown") direction = -1;
          if (automation.mode === "loopUp" || automation.mode === "onceUp") direction = 1;

          let elapsed = (Number(automation.elapsed) || 0) + dt;
          let progress = elapsed / durationSeconds;
          let nextDirection = direction;
          let running = true;

          if (automation.mode === "onceUp") {
            if (progress >= 1) {
              progress = 1;
              elapsed = durationSeconds;
              running = false;
            }
          } else if (automation.mode === "loopUp") {
            if (progress >= 1) {
              progress = 1;
              elapsed = 0;
            }
          } else if (automation.mode === "loopDown") {
            direction = -1;
            nextDirection = -1;
            if (progress >= 1) {
              progress = 1;
              elapsed = 0;
            }
          } else if (automation.mode === "bounce") {
            if (progress >= 1) {
              progress = 1;
              elapsed = 0;
              nextDirection = direction < 0 ? 1 : -1;
            }
          }

          let nextValue;
          if (automation.mode === "loopDown" || direction < 0) {
            nextValue = max - (quantizeSweepValue(min, max, progress, stepSize) - min);
          } else {
            nextValue = quantizeSweepValue(min, max, progress, stepSize);
          }

          if (automation.mode === "bounce") {
            if (nextValue >= max) {
              direction = -1;
            } else if (nextValue <= min) {
              direction = 1;
            }
          }

          const roundedValue = Number(nextValue.toFixed(4));
          updates.push({ targetKey: automation.targetKey, value: roundedValue });
          return {
            ...automation,
            value: roundedValue,
            direction: nextDirection,
            elapsed,
            running,
          };
        });

        automationsRef.current = nextAutomations;
        setAutomations(nextAutomations);

        if (updates.length > 0) {
          setCircuit((current) => applyAutomationValues(current, updates));
        }
      }

      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  function updateDiagramSettings(patch) {
    setDiagramSettings((current) => ({ ...current, ...patch }));
  }

  function toggleCircuitScaleFamily(scaleKey) {
    setDiagramSettings((current) => {
      const visibleScaleKeys = Array.isArray(current.visibleScaleKeys)
        ? current.visibleScaleKeys
        : defaultDiagramSettings.visibleScaleKeys;
      const nextKeys = visibleScaleKeys.includes(scaleKey)
        ? visibleScaleKeys.filter((key) => key !== scaleKey)
        : [...visibleScaleKeys, scaleKey];
      return { ...current, visibleScaleKeys: nextKeys.length > 0 ? nextKeys : visibleScaleKeys };
    });
  }

  function updateTimeSettings(patch) {
    setTimeSettings((current) => ({ ...current, ...patch }));
  }

  function updateScale(index, field, value) {
    setScales((current) =>
      current.map((scale, i) =>
        i === index ? { ...scale, [field]: field === "ratio" ? Number(value) : value } : scale,
      ),
    );
  }

  function updateManualPhasor(index, field, value) {
    setManualPhasors((current) =>
      current.map((phasor, i) => {
        if (i !== index) return phasor;
        const next = {
          ...phasor,
          [field]: ["mag", "angle", "labelX", "labelY"].includes(field) ? Number(value) : value,
        };
        if (field === "label") next.scaleKey = inferScaleKey(value);
        return next;
      }),
    );
  }

  function updateCircuitPhasorPref(index, field, value) {
    const phasor = activeCircuitPhasors[index];
    if (!phasor || !["visible", "expanded", "labelX", "labelY", "color"].includes(field)) return;
    setCircuitPrefs((current) => ({
      ...current,
      [phasor.label]: {
        ...(current[phasor.label] || {}),
        [field]: ["labelX", "labelY"].includes(field) ? Number(value) : value,
      },
    }));
  }

  function updatePhasor(index, field, value) {
    if (mode === "circuit") updateCircuitPhasorPref(index, field, value);
    else updateManualPhasor(index, field, value);
  }

  function updatePhasorColorByLabel(label, color) {
    if (mode === "circuit") {
      setCircuitPrefs((current) => ({
        ...current,
        [label]: {
          ...(current[label] || {}),
          color,
        },
      }));
      return;
    }

    setManualPhasors((current) =>
      current.map((phasor) => (phasor.label === label ? { ...phasor, color } : phasor)),
    );
  }

  function addAutomation() {
    const target = automationTargets[0];
    if (!target) return;
    const min = target.field === "r" ? Math.max(0, target.value - 50) : target.value - 50;
    const max = target.value + 50;
    const range = Math.max(Math.abs(max - min), 1);

    setAutomations((current) => [
      ...current,
      {
        id: createId(),
        targetKey: target.key,
        min: Number(min.toFixed(3)),
        max: Number(max.toFixed(3)),
        speed: 5,
        stepSize: 1,
        elapsed: 0,
        mode: "onceUp",
        value: Number(min.toFixed(3)),
        direction: 1,
        running: false,
      },
    ]);
  }

  function updateAutomation(id, patch) {
    setAutomations((current) =>
      current.map((automation) => (automation.id === id ? { ...automation, ...patch } : automation)),
    );
  }

  function playAutomation(id) {
    const selected = automations.find((automation) => automation.id === id);
    if (!selected) return;
    const { min, max } = normalizedRange(selected.min, selected.max);
    const direction = selected.mode === "loopDown" ? -1 : 1;
    const value = direction < 0 ? max : min;

    setAutomations((current) =>
      current.map((automation) => {
        if (automation.id !== id) return automation;

        return {
          ...automation,
          value,
          direction,
          elapsed: 0,
          running: true,
        };
      }),
    );
    setCircuit((currentCircuit) =>
      applyAutomationValues(currentCircuit, [{ targetKey: selected.targetKey, value }]),
    );
  }

  function stopAutomation(id) {
    setAutomations((current) =>
      current.map((automation) =>
        automation.id === id ? { ...automation, running: false } : automation,
      ),
    );
  }

  function removeAutomation(id) {
    setAutomations((current) => current.filter((automation) => automation.id !== id));
  }

  function autoAssignColors() {
    if (mode === "circuit") {
      setCircuitPrefs((current) => {
        const next = { ...current };
        circuitPhasors.forEach((phasor, index) => {
          next[phasor.label] = {
            ...(next[phasor.label] || {}),
            color: contrastPalette[index % contrastPalette.length],
          };
        });
        return next;
      });
      return;
    }

    setManualPhasors((current) =>
      current.map((phasor, index) => ({
        ...phasor,
        color: contrastPalette[index % contrastPalette.length],
      })),
    );
  }

  function togglePhasor(index) {
    const phasor = activePhasors[index];
    if (!phasor) return;
    updatePhasor(index, "visible", !phasor.visible);
  }

  function toggleExpanded(index) {
    const phasor = activePhasors[index];
    if (!phasor) return;
    updatePhasor(index, "expanded", phasor.expanded === false);
  }

  function expandAllPhasors() {
    if (mode === "circuit") {
      setCircuitPrefs((current) => {
        const next = { ...current };
        circuitPhasors.forEach((p) => {
          next[p.label] = { ...(next[p.label] || {}), expanded: true };
        });
        return next;
      });
      return;
    }
    setManualPhasors((current) => current.map((p) => ({ ...p, expanded: true })));
  }

  function collapseAllPhasors() {
    if (mode === "circuit") {
      setCircuitPrefs((current) => {
        const next = { ...current };
        circuitPhasors.forEach((p) => {
          next[p.label] = { ...(next[p.label] || {}), expanded: false };
        });
        return next;
      });
      return;
    }
    setManualPhasors((current) => current.map((p) => ({ ...p, expanded: false })));
  }

  function addPhasor() {
    setManualPhasors((current) => {
      const nextNumber = current.length + 1;
      const label = `V${nextNumber}`;
      return [
        ...current,
        {
          label,
          mag: 100,
          angle: 0,
          color: colorOptions[current.length % colorOptions.length],
          visible: true,
          labelX: 16,
          labelY: -12,
          scaleKey: inferScaleKey(label),
          expanded: true,
        },
      ];
    });
  }

  function removePhasor(index) {
    if (mode === "circuit") return;
    setManualPhasors((current) => current.filter((_, i) => i !== index));
  }

  function updateCircuitSource(field, value) {
    setCircuit((current) => ({ ...current, [field]: Number(value) || 0 }));
  }

  function addBranch() {
    setCircuit((current) => ({
      ...current,
      branches: [
        ...current.branches,
        {
          name: `Branch ${current.branches.length + 1}`,
          impedances: [{ label: `Z${Date.now().toString().slice(-3)}`, r: 10, x: 0 }],
        },
      ],
    }));
  }

  function removeBranch(branchIndex) {
    setCircuit((current) => {
      const branches = current.branches.filter((_, i) => i !== branchIndex);
      const safeBranches =
        branches.length > 0
          ? branches
          : [{ name: "Branch 1", impedances: [{ label: "Z1", r: 10, x: 0 }] }];
      return {
        ...current,
        branches: safeBranches.map((branch, i) => ({ ...branch, name: `Branch ${i + 1}` })),
      };
    });
  }

  function addImpedance(branchIndex) {
    setCircuit((current) => {
      const count = current.branches.reduce((sum, b) => sum + b.impedances.length, 0) + 1;
      return {
        ...current,
        branches: current.branches.map((branch, i) =>
          i === branchIndex
            ? { ...branch, impedances: [...branch.impedances, { label: `Z${count}`, r: 10, x: 0 }] }
            : branch,
        ),
      };
    });
  }

  function removeImpedance(branchIndex, zIndex) {
    setCircuit((current) => ({
      ...current,
      branches: current.branches.map((branch, i) => {
        if (i !== branchIndex) return branch;
        const impedances = branch.impedances.filter((_, zi) => zi !== zIndex);
        return {
          ...branch,
          impedances: impedances.length > 0 ? impedances : [{ label: `Z${branchIndex + 1}`, r: 10, x: 0 }],
        };
      }),
    }));
  }

  function updateImpedance(branchIndex, zIndex, field, value) {
    setCircuit((current) => ({
      ...current,
      branches: current.branches.map((branch, i) => {
        if (i !== branchIndex) return branch;
        return {
          ...branch,
          impedances: branch.impedances.map((z, zi) =>
            zi === zIndex
              ? { ...z, [field]: field === "r" || field === "x" ? Number(value) || 0 : value }
              : z,
          ),
        };
      }),
    }));
  }

  function saveProject() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    setProjectStatus("Saved to this browser.");
  }

  function loadProject() {
    const next = readStoredProject();
    setScales(next.scales);
    setManualPhasors(next.manualPhasors);
    setCircuit(next.circuit);
    setMode(next.mode);
    setDiagramSettings(next.diagramSettings);
    setTimeSettings(next.timeSettings);
    setCircuitPrefs(next.circuitPrefs);
    setAutomations(next.automations);
    setDashboardLayout(next.dashboardLayout);
    setDashboardSettings(next.dashboardSettings);
    setProjectStatus("Loaded from this browser.");
  }

  function exportProject() {
    downloadText("phasor-project.json", JSON.stringify(project, null, 2), "application/json");
    setProjectStatus("Exported project JSON.");
  }

  function importProject(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = normalizeProject(JSON.parse(String(reader.result)));
        setScales(next.scales);
        setManualPhasors(next.manualPhasors);
        setCircuit(next.circuit);
        setMode(next.mode);
        setDiagramSettings(next.diagramSettings);
        setTimeSettings(next.timeSettings);
        setCircuitPrefs(next.circuitPrefs);
        setAutomations(next.automations);
        setDashboardLayout(next.dashboardLayout);
        setDashboardSettings(next.dashboardSettings);
        setProjectStatus("Imported project JSON.");
      } catch {
        setProjectStatus("Import failed: invalid JSON.");
      }
    };
    reader.readAsText(file);
  }

  function getSerializedDiagramSvg() {
    const source = phasorSvgRef.current;
    if (!source) return "";
    const cloneSvg = source.cloneNode(true);
    cloneSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cloneSvg.setAttribute("width", "760");
    cloneSvg.setAttribute("height", "760");

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent =
      ".diagram-label{font-weight:700;paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round}";
    cloneSvg.insertBefore(style, cloneSvg.firstChild);

    return new XMLSerializer().serializeToString(cloneSvg);
  }

  function exportSvg() {
    const svgText = getSerializedDiagramSvg();
    if (!svgText) return;
    downloadText("phasor-diagram.svg", svgText, "image/svg+xml");
    setProjectStatus("Exported diagram SVG.");
  }

  function exportPng() {
    const svgText = getSerializedDiagramSvg();
    if (!svgText) return;

    const image = new Image();
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 760;
      canvas.height = 760;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "phasor-diagram.png";
        a.click();
        URL.revokeObjectURL(url);
        setProjectStatus("Exported diagram PNG.");
      }, "image/png");
    };
    image.src = svgUrl;
  }

  function handleDashboardLayoutChange(nextLayout) {
    setDashboardLayout((current) => {
      const byId = new Map(nextLayout.map((item) => [item.i, item]));
      return current.map((item) => ({
        ...item,
        ...(byId.get(item.i) || {}),
        minW: item.minW,
        minH: item.minH,
      }));
    });
  }

  function setDashboardPanelVisible(panelId, visible) {
    setDashboardLayout((current) =>
      current.map((item) => (item.i === panelId ? { ...item, visible } : item)),
    );
  }

  function resetDashboardLayout() {
    setDashboardLayout(normalizeDashboardLayout(defaultLayoutProject.dashboardLayout));
    setDashboardSettings({
      ...defaultDashboardSettings,
      ...(defaultLayoutProject.dashboardSettings || {}),
    });
    setProjectStatus("Reset dashboard layout.");
  }

  const visibleDashboardLayout = dashboardLayout.filter(
    (item) =>
      item.visible !== false && (mode === "circuit" || !CIRCUIT_DASHBOARD_PANEL_IDS.includes(item.i)),
  );

  const dashboardViewItems = dashboardLayout.map((item) => {
    const circuitOnly = CIRCUIT_DASHBOARD_PANEL_IDS.includes(item.i);
    return {
      id: item.i,
      title: dashboardPanelTitles[item.i] || item.i,
      visible: item.visible !== false,
      disabled: mode !== "circuit" && circuitOnly,
      note: mode !== "circuit" && circuitOnly ? "Circuit mode only" : "",
    };
  });

  function renderDashboardPanel(panelId) {
    if (panelId === "phasor-view") {
      return (
        <div className="phasor-view-surface">
          <PhasorDiagram
            svgRef={phasorSvgRef}
            phasors={activePhasors}
            scales={scales}
            showGrid={diagramSettings.showGrid}
            showDiagramLabels={diagramSettings.showDiagramLabels}
            lineThickness={diagramSettings.lineThickness}
            arrowSize={diagramSettings.arrowSize}
            unitsPerDivision={diagramSettings.phasorUnitsPerDivision}
            autoMaxMag={automationAutoMaxMag}
            tipToTailGroups={tipToTailGroups}
          />
        </div>
      );
    }

    if (panelId === "time-plot") {
      return (
        <TimePlot
          phasors={activePhasors}
          scales={scales}
          settings={timeSettings}
          colorPickerMode={diagramSettings.colorPickerMode}
          colorPalette={contrastPalette}
          selectedWaveLabel={selectedWaveLabel}
          onSelectedWaveLabelChange={setSelectedWaveLabel}
          onSettingsChange={updateTimeSettings}
          onPhasorColorChange={updatePhasorColorByLabel}
          onPrevCursorCycle={() =>
            setTimeSettings((current) => ({
              ...current,
              cursorCycleOffset: Math.max(0, current.cursorCycleOffset - 1),
            }))
          }
          onNextCursorCycle={(maxCursorCycle) =>
            setTimeSettings((current) => ({
              ...current,
              cursorCycleOffset: Math.min(maxCursorCycle, current.cursorCycleOffset + 1),
            }))
          }
          showMeasurements={false}
        />
      );
    }

    if (panelId === "measurements") {
      return (
        <TimePlot
          phasors={activePhasors}
          scales={scales}
          settings={timeSettings}
          colorPickerMode={diagramSettings.colorPickerMode}
          colorPalette={contrastPalette}
          selectedWaveLabel={selectedWaveLabel}
          onSelectedWaveLabelChange={setSelectedWaveLabel}
          onSettingsChange={updateTimeSettings}
          onPhasorColorChange={updatePhasorColorByLabel}
          onPrevCursorCycle={() => {}}
          onNextCursorCycle={() => {}}
          showHeader={false}
          showPlot={false}
        />
      );
    }

    if (panelId === "circuit-preview") {
      return (
        <div className="circuit-preview-frame">
          <CircuitPreview circuit={circuit} />
        </div>
      );
    }

    if (panelId === "circuit-builder") {
      return (
        <CircuitBuilder
          circuit={circuit}
          solvedCircuit={solvedCircuit}
          onSourceChange={updateCircuitSource}
          onAddBranch={addBranch}
          onRemoveBranch={removeBranch}
          onAddImpedance={addImpedance}
          onRemoveImpedance={removeImpedance}
          onImpedanceChange={updateImpedance}
        />
      );
    }

    if (panelId === "automations") {
      return (
        <AutomationPanel
          automations={automations}
          targetOptions={automationTargets}
          onAddAutomation={addAutomation}
          onUpdateAutomation={updateAutomation}
          onPlayAutomation={playAutomation}
          onStopAutomation={stopAutomation}
          onRemoveAutomation={removeAutomation}
        />
      );
    }

    if (panelId === "phasors") {
      return (
        <PhasorPanel
          phasors={activePhasors}
          scales={scales}
          mode={mode}
          solvedCircuit={solvedCircuit}
          circuit={circuit}
          colorPickerMode={diagramSettings.colorPickerMode}
          colorPalette={contrastPalette}
          onCircuitSourceChange={updateCircuitSource}
          onAddBranch={addBranch}
          onRemoveBranch={removeBranch}
          onAddImpedance={addImpedance}
          onRemoveImpedance={removeImpedance}
          onImpedanceChange={updateImpedance}
          onPhasorChange={updatePhasor}
          onTogglePhasor={togglePhasor}
          onToggleExpanded={toggleExpanded}
          onExpandAll={expandAllPhasors}
          onCollapseAll={collapseAllPhasors}
          onAddPhasor={addPhasor}
          onRemovePhasor={removePhasor}
          showCircuitBuilder={false}
          embedded
        />
      );
    }

    return null;
  }

  function getDashboardPanelTitle(panelId) {
    return dashboardPanelTitles[panelId] || panelId;
  }

  const dashboardGridStyle = {
    minHeight: dashboardMinHeight,
    "--dashboard-cell-x": `calc((100% - ${DASHBOARD_PADDING[0] * 2}px - ${
      DASHBOARD_MARGIN[0] * Math.max(0, dashboardCols - 1)
    }px) / ${dashboardCols})`,
    "--dashboard-cell-y": `${DASHBOARD_ROW_HEIGHT}px`,
    "--dashboard-gap-x": `${DASHBOARD_MARGIN[0]}px`,
    "--dashboard-gap-y": `${DASHBOARD_MARGIN[1]}px`,
    "--dashboard-padding-x": `${DASHBOARD_PADDING[0]}px`,
    "--dashboard-padding-y": `${DASHBOARD_PADDING[1]}px`,
  };

  return (
    <div className="page">
      <div className="container">
        <header className="app-header">
          <div>
            <h1>Phasor Diagram</h1>
            <div className="subtitle">Toggle, add, remove, and edit phasors.</div>
          </div>
          <TopMenu
            scales={scales}
            mode={mode}
            diagramSettings={diagramSettings}
            colorPalette={contrastPalette}
            automations={automations}
            automationTargets={automationTargets}
            viewItems={dashboardViewItems}
            dashboardSettings={dashboardSettings}
            projectStatus={projectStatus}
            onModeChange={setMode}
            onViewItemChange={setDashboardPanelVisible}
            onResetDashboardLayout={resetDashboardLayout}
            onDashboardSettingsChange={(patch) =>
              setDashboardSettings((current) => ({ ...current, ...patch }))
            }
            onDiagramSettingsChange={updateDiagramSettings}
            onCircuitScaleFamilyToggle={toggleCircuitScaleFamily}
            onAutoAssignColors={autoAssignColors}
            onAddAutomation={addAutomation}
            onUpdateAutomation={updateAutomation}
            onPlayAutomation={playAutomation}
            onStopAutomation={stopAutomation}
            onRemoveAutomation={removeAutomation}
            onScaleChange={updateScale}
            onSaveProject={saveProject}
            onLoadProject={loadProject}
            onExportProject={exportProject}
            onImportProject={importProject}
            onExportSvg={exportSvg}
            onExportPng={exportPng}
          />
        </header>

        <div className="dashboard-wrap" ref={dashboardWrapRef} style={dashboardGridStyle}>
          <GridLayout
            className="dashboard-grid"
            layout={visibleDashboardLayout}
            cols={dashboardCols}
            rowHeight={DASHBOARD_ROW_HEIGHT}
            margin={DASHBOARD_MARGIN}
            containerPadding={DASHBOARD_PADDING}
            compactType={dashboardSettings.compactType === "none" ? null : dashboardSettings.compactType}
            preventCollision={false}
            draggableHandle=".dashboard-drag-handle"
            onLayoutChange={handleDashboardLayoutChange}
          >
            {visibleDashboardLayout.map((item) => (
              <div key={item.i}>
                <DashboardPanel
                  title={getDashboardPanelTitle(item.i)}
                  onClose={() => setDashboardPanelVisible(item.i, false)}
                >
                  {renderDashboardPanel(item.i)}
                </DashboardPanel>
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  );
}
