import { cAdd, cConj, cDiv, cInv, cMul, complex, polarToComplex } from "./complexMath.js";
import { makePhasor } from "./phasorMath.js";

export function solveCircuit(circuit, colorOptions) {
  const calculated = [];
  const source = polarToComplex(Number(circuit.sourceMag) || 0, Number(circuit.sourceAngle) || 0);
  const colorAt = (index) => colorOptions[index % colorOptions.length];

  const branchData = circuit.branches.map((branch) => {
    const zBranch = branch.impedances.reduce(
      (sum, z) => cAdd(sum, complex(Number(z.r) || 0, Number(z.x) || 0)),
      complex(0, 0),
    );
    const iBranch = cDiv(source, zBranch);
    const sBranch = cMul(source, cConj(iBranch));
    const componentData = branch.impedances.map((z) => {
      const zComplex = complex(Number(z.r) || 0, Number(z.x) || 0);
      const vZ = cMul(iBranch, zComplex);
      const sZ = cMul(vZ, cConj(iBranch));
      return { z, zComplex, vZ, sZ };
    });

    return { branch, zBranch, iBranch, sBranch, componentData };
  });

  let admittanceTotal = complex(0, 0);
  branchData.forEach((b) => {
    admittanceTotal = cAdd(admittanceTotal, cInv(b.zBranch));
  });

  const zTotal = cInv(admittanceTotal);
  const iTotal = cDiv(source, zTotal);
  const sTotal = cMul(source, cConj(iTotal));

  calculated.push(makePhasor("Vs", source, "#111827", "voltage", false));
  calculated.push(makePhasor("It", iTotal, "#2563eb", "current", false));
  calculated.push(
    makePhasor("Zt", zTotal, colorAt(8), "impedance", false, {
      family: "impedance",
    }),
  );
  pushPowerPhasors(calculated, "T", sTotal, 5, colorAt);

  branchData.forEach((b, branchIndex) => {
    const branchColor = colorAt(branchIndex + 2);
    calculated.push(makePhasor(`I_B${branchIndex + 1}`, b.iBranch, branchColor, "current", false));
    calculated.push(
      makePhasor(`Z_B${branchIndex + 1}`, b.zBranch, colorAt(branchIndex + 7), "impedance", false, {
        family: "impedance",
      }),
    );
    pushPowerPhasors(calculated, `B${branchIndex + 1}`, b.sBranch, branchIndex + 4, colorAt);

    b.componentData.forEach(({ z, zComplex, vZ, sZ }, zIndex) => {
      const componentColor = colorAt(zIndex + branchIndex + 3);
      calculated.push(
        makePhasor(
          `V_${z.label}`,
          vZ,
          componentColor,
          "voltage",
          false,
        ),
      );
      calculated.push(
        makePhasor(`Z_${z.label}`, zComplex, colorAt(zIndex + branchIndex + 8), "impedance", false, {
          family: "impedance",
        }),
      );
      pushPowerPhasors(calculated, z.label, sZ, zIndex + branchIndex + 6, colorAt);
    });
  });

  return { phasors: calculated, zTotal, iTotal, sTotal, branchData };
}

function pushPowerPhasors(calculated, label, sValue, colorOffset, colorAt) {
  const pValue = complex(sValue.re, 0);
  const qValue = complex(0, sValue.im);

  calculated.push(
    makePhasor(`S_${label}`, sValue, colorAt(colorOffset), "power", false, {
      family: "power",
      unit: "VA",
    }),
  );
  calculated.push(
    makePhasor(`P_${label}`, pValue, colorAt(colorOffset + 1), "power", false, {
      family: "power",
      unit: "W",
    }),
  );
  calculated.push(
    makePhasor(`Q_${label}`, qValue, colorAt(colorOffset + 2), "power", false, {
      family: "power",
      unit: "var",
    }),
  );
}
