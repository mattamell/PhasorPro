import ScaleEditor from "./ScaleEditor.jsx";
import AutomationPanel from "./AutomationPanel.jsx";

export default function TopMenu({
  scales,
  mode,
  diagramSettings,
  colorPalette,
  automations,
  automationTargets,
  projectStatus,
  onModeChange,
  onDiagramSettingsChange,
  onCircuitScaleFamilyToggle,
  onAutoAssignColors,
  onAddAutomation,
  onUpdateAutomation,
  onPlayAutomation,
  onStopAutomation,
  onRemoveAutomation,
  onScaleChange,
  onSaveProject,
  onLoadProject,
  onExportProject,
  onImportProject,
  onExportSvg,
  onExportPng,
}) {
  return (
    <div className="top-menu">
      <details className="top-dropdown">
        <summary>Mode</summary>
        <div className="dropdown-panel narrow">
          <div className="mode-menu">
            <p className="scale-title">Phasor Source</p>
            <div className="mode-switch" aria-label="Phasor source mode">
              <button
                type="button"
                className={mode === "manual" ? "active" : ""}
                onClick={() => onModeChange("manual")}
              >
                Manual
              </button>
              <button
                type="button"
                className={mode === "circuit" ? "active" : ""}
                onClick={() => onModeChange("circuit")}
              >
                Circuit
              </button>
            </div>
          </div>
        </div>
      </details>

      <details className="top-dropdown">
        <summary>Diagram</summary>
        <div className="dropdown-panel">
          <div className="diagram-menu">
            <p className="scale-title">Diagram Controls</p>
            <div className="diagram-toggle-grid">
              <label className="row-between">
                <input
                  type="checkbox"
                  checked={diagramSettings.showGrid}
                  onChange={(e) => onDiagramSettingsChange({ showGrid: e.target.checked })}
                />
                Circular grid
              </label>
              <label className="row-between">
                <input
                  type="checkbox"
                  checked={diagramSettings.showDiagramLabels}
                  onChange={(e) => onDiagramSettingsChange({ showDiagramLabels: e.target.checked })}
                />
                Diagram labels
              </label>
              <label className="row-between">
                <input
                  type="checkbox"
                  checked={diagramSettings.notesView}
                  onChange={(e) => onDiagramSettingsChange({ notesView: e.target.checked })}
                />
                Notes view
              </label>
            </div>

            <div className="control-grid">
              <label>
                Units/div
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={diagramSettings.phasorUnitsPerDivision ?? ""}
                  placeholder="Auto"
                  onChange={(e) => onDiagramSettingsChange({ phasorUnitsPerDivision: e.target.value })}
                />
                <span className="small-value">
                  {Number(diagramSettings.phasorUnitsPerDivision) > 0 ? "Fixed diagram scale" : "Auto scale"}
                </span>
              </label>

              <label>
                Line thickness
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={diagramSettings.lineThickness}
                  onChange={(e) => onDiagramSettingsChange({ lineThickness: Number(e.target.value) })}
                />
                <span className="small-value">{diagramSettings.lineThickness}px</span>
              </label>

              <label>
                Arrow size
                <input
                  type="range"
                  min="6"
                  max="24"
                  step="1"
                  value={diagramSettings.arrowSize}
                  onChange={(e) => onDiagramSettingsChange({ arrowSize: Number(e.target.value) })}
                />
                <span className="small-value">{diagramSettings.arrowSize}px</span>
              </label>
            </div>

            {mode === "circuit" && (
              <div className="diagram-section">
                <p className="scale-title">Circuit Phasor Families</p>
                <div className="diagram-toggle-grid">
                  {scales.map((scale) => (
                    <label className="row-between" key={scale.key}>
                      <input
                        type="checkbox"
                        checked={(diagramSettings.visibleScaleKeys || []).includes(scale.key)}
                        onChange={() => onCircuitScaleFamilyToggle(scale.key)}
                      />
                      {scale.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {mode === "circuit" && (
              <div className="diagram-section">
                <p className="scale-title">Tip-to-tail Additions</p>
                <div className="diagram-toggle-grid">
                  <label className="row-between">
                    <input
                      type="checkbox"
                      checked={diagramSettings.showTipToTail}
                      onChange={(e) => onDiagramSettingsChange({ showTipToTail: e.target.checked })}
                    />
                    Show construction vectors
                  </label>
                  <label className="row-between">
                    <input
                      type="checkbox"
                      checked={diagramSettings.tipToTailImpedance}
                      onChange={(e) => onDiagramSettingsChange({ tipToTailImpedance: e.target.checked })}
                      disabled={!diagramSettings.showTipToTail}
                    />
                    Series impedance totals
                  </label>
                  <label className="row-between">
                    <input
                      type="checkbox"
                      checked={diagramSettings.tipToTailPower}
                      onChange={(e) => onDiagramSettingsChange({ tipToTailPower: e.target.checked })}
                      disabled={!diagramSettings.showTipToTail}
                    />
                    Complex power total
                  </label>
                </div>
              </div>
            )}

            <div className="diagram-section">
              <p className="scale-title">Colors</p>
              <button type="button" className="collapse-button full-width-button" onClick={onAutoAssignColors}>
                Auto contrast colors
              </button>
              <label className="row-between color-mode-toggle">
                <input
                  type="checkbox"
                  checked={diagramSettings.colorPickerMode === "palette"}
                  onChange={(e) =>
                    onDiagramSettingsChange({
                      colorPickerMode: e.target.checked ? "palette" : "fine",
                    })
                  }
                />
                Use 10-color picker
              </label>
              <div className="palette-preview" aria-hidden="true">
                {colorPalette.map((color) => (
                  <span key={color} style={{ background: color }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </details>

      <details className="top-dropdown">
        <summary>Scales</summary>
        <div className="dropdown-panel">
          <ScaleEditor scales={scales} onScaleChange={onScaleChange} compact />
        </div>
      </details>

      <details className="top-dropdown">
        <summary>Automate</summary>
        <div className="dropdown-panel wide">
          <AutomationPanel
            automations={automations}
            targetOptions={automationTargets}
            onAddAutomation={onAddAutomation}
            onUpdateAutomation={onUpdateAutomation}
            onPlayAutomation={onPlayAutomation}
            onStopAutomation={onStopAutomation}
            onRemoveAutomation={onRemoveAutomation}
          />
        </div>
      </details>

      <details className="top-dropdown">
        <summary>Project</summary>
        <div className="dropdown-panel">
          <div className="project-menu">
            <div className="button-grid">
              <button type="button" className="collapse-button" onClick={onSaveProject}>
                Save
              </button>
              <button type="button" className="collapse-button" onClick={onLoadProject}>
                Load
              </button>
              <button type="button" className="collapse-button" onClick={onExportProject}>
                Export JSON
              </button>
              <label className="collapse-button import-button">
                Import JSON
                <input type="file" accept="application/json,.json" onChange={onImportProject} />
              </label>
              <button type="button" className="collapse-button" onClick={onExportSvg}>
                Export SVG
              </button>
              <button type="button" className="collapse-button" onClick={onExportPng}>
                Export PNG
              </button>
            </div>
            <div className="project-status">{projectStatus}</div>
          </div>
        </div>
      </details>
    </div>
  );
}
