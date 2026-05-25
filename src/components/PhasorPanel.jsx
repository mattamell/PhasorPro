import CircuitBuilder from "./CircuitBuilder.jsx";
import ColorPicker from "./ColorPicker.jsx";
import DragNumberInput from "./DragNumberInput.jsx";
import { getPhasorUnit, polarToXY } from "../utils/phasorMath.js";

export default function PhasorPanel({
  phasors,
  scales,
  mode,
  solvedCircuit,
  circuit,
  colorPickerMode,
  colorPalette,
  onCircuitSourceChange,
  onAddBranch,
  onRemoveBranch,
  onAddImpedance,
  onRemoveImpedance,
  onImpedanceChange,
  onPhasorChange,
  onTogglePhasor,
  onToggleExpanded,
  onExpandAll,
  onCollapseAll,
  onAddPhasor,
  onRemovePhasor,
}) {
  const calculatedMode = mode === "circuit";

  return (
    <aside className="card sidebar resizable-panel">
      <div className="sidebar-header">
        <h2>Phasors</h2>
      </div>

      {calculatedMode && (
        <CircuitBuilder
          circuit={circuit}
          solvedCircuit={solvedCircuit}
          onSourceChange={onCircuitSourceChange}
          onAddBranch={onAddBranch}
          onRemoveBranch={onRemoveBranch}
          onAddImpedance={onAddImpedance}
          onRemoveImpedance={onRemoveImpedance}
          onImpedanceChange={onImpedanceChange}
        />
      )}

      <div className="phasor-list-controls">
        {!calculatedMode && (
          <button type="button" className="add-button" onClick={onAddPhasor}>
            + Add phasor
          </button>
        )}
        <div className="button-grid">
          <button type="button" className="collapse-button" onClick={onExpandAll}>
            Expand all
          </button>
          <button type="button" className="collapse-button" onClick={onCollapseAll}>
            Collapse all
          </button>
        </div>
      </div>

      <div className="mode-note">
        {calculatedMode
          ? "Calculated phasors are active. Magnitude and angle come from the circuit builder."
          : "Manual phasors are active. Edit phasors directly below."}
      </div>

      <div className="section-label">{calculatedMode ? "Calculated Phasors" : "Manual Phasors"}</div>
      <div className="phasor-list">
        {phasors.map((p, index) => (
          <PhasorCard
            key={`${p.label}-${index}`}
            phasor={p}
            index={index}
            scales={scales}
            calculatedMode={calculatedMode}
            colorPickerMode={colorPickerMode}
            colorPalette={colorPalette}
            onPhasorChange={onPhasorChange}
            onTogglePhasor={onTogglePhasor}
            onToggleExpanded={onToggleExpanded}
            onRemovePhasor={onRemovePhasor}
          />
        ))}
      </div>
    </aside>
  );
}

function PhasorCard({
  phasor,
  index,
  scales,
  calculatedMode,
  colorPickerMode,
  colorPalette,
  onPhasorChange,
  onTogglePhasor,
  onToggleExpanded,
  onRemovePhasor,
}) {
  const xy = polarToXY(Number(phasor.mag), Number(phasor.angle));
  const unit = getPhasorUnit(phasor, scales);

  return (
    <div className={`phasor-card ${phasor.visible ? "" : "hidden"}`}>
      <div className="phasor-summary">
        <label className="phasor-title">
          <input type="checkbox" checked={phasor.visible} onChange={() => onTogglePhasor(index)} />
          <span className="color-dot" style={{ background: phasor.color }} />
          <span>{phasor.label}</span>
        </label>
        <div className="phasor-actions">
          <span className="phasor-value">
            {phasor.mag}
            {unit}&ang;{phasor.angle}&deg;
          </span>
          <button type="button" className="collapse-button" onClick={() => onToggleExpanded(index)}>
            {phasor.expanded === false ? "Open" : "Close"}
          </button>
          <button
            type="button"
            className="remove-button"
            onClick={() => onRemovePhasor(index)}
            disabled={calculatedMode}
          >
            Remove
          </button>
        </div>
      </div>

      {phasor.expanded !== false && (
        <div className="phasor-details">
          <div className="input-grid">
            <label>
              Label
              <input
                value={phasor.label}
                disabled={calculatedMode}
                onChange={(e) => onPhasorChange(index, "label", e.target.value)}
              />
            </label>

            <label>
              Scale
              <select
                value={phasor.scaleKey}
                disabled={calculatedMode}
                onChange={(e) => onPhasorChange(index, "scaleKey", e.target.value)}
              >
                {scales.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Color
              <ColorPicker
                value={phasor.color}
                mode={colorPickerMode}
                palette={colorPalette}
                ariaLabel={`Change ${phasor.label} color`}
                onChange={(color) => onPhasorChange(index, "color", color)}
              />
            </label>

            <label>
              Magnitude
              <DragNumberInput
                value={phasor.mag}
                step="any"
                dragStep={1}
                disabled={calculatedMode}
                onChange={(e) => onPhasorChange(index, "mag", e.target.value)}
              />
            </label>

            <label>
              Angle &deg;
              <DragNumberInput
                value={phasor.angle}
                step="any"
                dragStep={1}
                disabled={calculatedMode}
                onChange={(e) => onPhasorChange(index, "angle", e.target.value)}
              />
            </label>

            <label>
              Label X
              <DragNumberInput
                value={phasor.labelX || 0}
                step="1"
                dragStep={1}
                onChange={(e) => onPhasorChange(index, "labelX", e.target.value)}
              />
            </label>

            <label>
              Label Y
              <DragNumberInput
                value={phasor.labelY || 0}
                step="1"
                dragStep={1}
                onChange={(e) => onPhasorChange(index, "labelY", e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      <div className="rect-value">
        Rectangular: {xy.x.toFixed(2)} {xy.y >= 0 ? "+" : "\u2212"} j{Math.abs(xy.y).toFixed(2)}
      </div>
    </div>
  );
}
