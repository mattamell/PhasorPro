import DragNumberInput from "./DragNumberInput.jsx";

export default function AutomationPanel({
  automations,
  targetOptions,
  onAddAutomation,
  onUpdateAutomation,
  onPlayAutomation,
  onStopAutomation,
  onRemoveAutomation,
}) {
  return (
    <div className="automation-panel">
      <div className="row-between">
        <p className="scale-title">Automate Values</p>
        <button type="button" className="collapse-button" onClick={onAddAutomation}>
          Add automation
        </button>
      </div>

      {automations.length === 0 ? (
        <div className="automation-empty">Add an automation to sweep a circuit R or X value.</div>
      ) : (
        <div className="automation-table-wrap">
          <table className="automation-table">
            <thead>
              <tr>
                <th>Value</th>
                <th>Min</th>
                <th>Max</th>
                <th>Step</th>
                <th>Time (s)</th>
                <th>Mode</th>
                <th>Run</th>
              </tr>
            </thead>
            <tbody>
              {automations.map((automation) => (
                <tr key={automation.id}>
                  <td>
                    <select
                      value={automation.targetKey}
                      onChange={(event) =>
                        onUpdateAutomation(automation.id, { targetKey: event.target.value })
                      }
                    >
                      {targetOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <DragNumberInput
                      value={automation.min}
                      step="any"
                      dragStep={1}
                      onChange={(event) => onUpdateAutomation(automation.id, { min: event.target.value })}
                    />
                  </td>
                  <td>
                    <DragNumberInput
                      value={automation.max}
                      step="any"
                      dragStep={1}
                      onChange={(event) => onUpdateAutomation(automation.id, { max: event.target.value })}
                    />
                  </td>
                  <td>
                    <DragNumberInput
                      value={automation.stepSize}
                      min="0"
                      step="any"
                      dragStep={1}
                      onChange={(event) =>
                        onUpdateAutomation(automation.id, { stepSize: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <DragNumberInput
                      value={automation.speed}
                      min="0"
                      step="any"
                      dragStep={1}
                      onChange={(event) =>
                        onUpdateAutomation(automation.id, { speed: event.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={automation.mode}
                      onChange={(event) => onUpdateAutomation(automation.id, { mode: event.target.value })}
                    >
                      <option value="onceUp">Once min to max</option>
                      <option value="loopUp">Loop min to max</option>
                      <option value="loopDown">Loop max to min</option>
                      <option value="bounce">Back and forth</option>
                    </select>
                  </td>
                  <td>
                    <div className="automation-actions">
                      {automation.running ? (
                        <button
                          type="button"
                          className="collapse-button"
                          onClick={() => onStopAutomation(automation.id)}
                        >
                          Stop
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="collapse-button"
                          onClick={() => onPlayAutomation(automation.id)}
                          disabled={targetOptions.length === 0}
                        >
                          Play
                        </button>
                      )}
                      <button
                        type="button"
                        className="danger-mini"
                        onClick={() => onRemoveAutomation(automation.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
