import ColorPicker from "./ColorPicker.jsx";

export default function MeasurementTable({
  measurements,
  show,
  onToggleWave,
  onWaveColorChange,
  onSelectWave,
  colorPickerMode,
  colorPalette,
}) {
  if (!show) return null;

  return (
    <div className="measurement-table-wrap">
      <table className="measurement-table">
        <thead>
          <tr>
            <th>Show</th>
            <th>Wave</th>
            <th>Value</th>
            <th>Cursor</th>
            <th>Time from 0</th>
            <th>Delta t from ref</th>
            <th>Phase from ref</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((row) => (
            <tr
              key={row.key}
              className={row.selected ? "selected-wave-row" : ""}
              onClick={() => onSelectWave(row.label)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={row.shownInTimePlot}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleWave(row.label)}
                  aria-label={`Show ${row.label} in time plot`}
                />
              </td>
              <td>
                <div className="wave-color-cell">
                  <span onClick={(e) => e.stopPropagation()}>
                    <ColorPicker
                      value={row.color}
                      mode={colorPickerMode}
                      palette={colorPalette}
                      onChange={(color) => onWaveColorChange(row.label, color)}
                      ariaLabel={`Change ${row.label} color`}
                    />
                  </span>
                  <button
                    type="button"
                    className="wave-label-button"
                    style={{ color: row.color }}
                    onClick={() => onSelectWave(row.label)}
                  >
                    {row.label}
                  </button>
                </div>
              </td>
              <td>{row.valueText}</td>
              <td>{row.cursorText}</td>
              <td>{row.timeText}</td>
              <td>{row.deltaText}</td>
              <td>{row.phaseText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
