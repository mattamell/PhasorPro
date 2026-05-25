import DragNumberInput from "./DragNumberInput.jsx";

export default function ScaleEditor({ scales, onScaleChange, compact = false }) {
  return (
    <div className={compact ? "scale-controls compact" : "scale-controls"}>
      <p className="scale-title">Scales</p>
      <div>
        {scales.map((scale, index) => (
          <div className="scale-row" key={scale.key}>
            <div className="scale-grid">
              <label>
                Name
                <input value={scale.name} onChange={(e) => onScaleChange(index, "name", e.target.value)} />
              </label>
              <label>
                Unit
                <input value={scale.unit} onChange={(e) => onScaleChange(index, "unit", e.target.value)} />
              </label>
              <label>
                Ratio
                <DragNumberInput
                  step="any"
                  dragStep={0.1}
                  value={scale.ratio}
                  onChange={(e) => onScaleChange(index, "ratio", e.target.value)}
                />
              </label>
              <label>
                Key
                <input value={scale.key} disabled />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="scale-help">
        Ratio means diagram length per value. Example: Voltage ratio 1 draws 600 V as 600 units.
        Current ratio 20 draws 5 A as 100 units.
      </div>
    </div>
  );
}
