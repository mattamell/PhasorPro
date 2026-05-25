import { fmtComplex, fmtPolar } from "../utils/complexMath.js";
import DragNumberInput from "./DragNumberInput.jsx";

export default function CircuitBuilder({
  circuit,
  solvedCircuit,
  onSourceChange,
  onAddBranch,
  onRemoveBranch,
  onAddImpedance,
  onRemoveImpedance,
  onImpedanceChange,
}) {
  return (
    <div className="circuit-builder">
      <div className="circuit-title">
        <h3>Circuit Builder</h3>
      </div>

      <div className="source-grid">
        <label>
          Source magnitude
          <DragNumberInput
            step="any"
            dragStep={10}
            value={circuit.sourceMag}
            onChange={(e) => onSourceChange("sourceMag", e.target.value)}
          />
        </label>
        <label>
          Source angle &deg;
          <DragNumberInput
            step="any"
            dragStep={1}
            value={circuit.sourceAngle}
            onChange={(e) => onSourceChange("sourceAngle", e.target.value)}
          />
        </label>
      </div>

      <div>
        {circuit.branches.map((branch, branchIndex) => (
          <div className="branch-card" key={branch.name}>
            <div className="branch-header">
              <span>{branch.name}</span>
              <div>
                <button type="button" className="mini-button" onClick={() => onAddImpedance(branchIndex)}>
                  + Z
                </button>
                <button
                  type="button"
                  className="danger-mini"
                  onClick={() => onRemoveBranch(branchIndex)}
                >
                  Remove
                </button>
              </div>
            </div>

            {branch.impedances.map((z, zIndex) => (
              <div className="impedance-row" key={`branch-${branchIndex}-z-${zIndex}`}>
                <div className="impedance-grid">
                  <label>
                    Label
                    <input
                      value={z.label}
                      onChange={(e) => onImpedanceChange(branchIndex, zIndex, "label", e.target.value)}
                    />
                  </label>
                  <label>
                    R
                    <DragNumberInput
                      step="any"
                      dragStep={1}
                      value={z.r}
                      onChange={(e) => onImpedanceChange(branchIndex, zIndex, "r", e.target.value)}
                    />
                  </label>
                  <label>
                    X
                    <DragNumberInput
                      step="any"
                      dragStep={1}
                      value={z.x}
                      onChange={(e) => onImpedanceChange(branchIndex, zIndex, "x", e.target.value)}
                    />
                  </label>
                  <label>
                    Action
                    <button
                      type="button"
                      className="danger-mini remove-z-button"
                      onClick={() => onRemoveImpedance(branchIndex, zIndex)}
                    >
                      Remove Z
                    </button>
                  </label>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="add-button add-branch-button" onClick={onAddBranch}>
        + Add parallel branch
      </button>

      <CircuitResults solvedCircuit={solvedCircuit} />
    </div>
  );
}

function CircuitResults({ solvedCircuit }) {
  const totalP = Number(solvedCircuit.sTotal?.re) || 0;
  const totalQ = Number(solvedCircuit.sTotal?.im) || 0;

  return (
    <div className="circuit-results">
      <strong>Ztotal:</strong> {fmtComplex(solvedCircuit.zTotal)} / {fmtPolar(solvedCircuit.zTotal, "\u03a9")}
      <br />
      <strong>Itotal:</strong> {fmtPolar(solvedCircuit.iTotal, "A")}
      <br />
      <strong>Stotal:</strong> {fmtPolar(solvedCircuit.sTotal, "VA")} ({totalP.toFixed(2)} W,{" "}
      {totalQ.toFixed(2)} var)
      <br />
      {solvedCircuit.branchData.map((b, index) => (
        <span key={`branch-result-${index}`}>
          B{index + 1}: Z = {fmtComplex(b.zBranch)}, I = {fmtPolar(b.iBranch, "A")}, S ={" "}
          {fmtPolar(b.sBranch, "VA")}
          <br />
        </span>
      ))}
    </div>
  );
}
