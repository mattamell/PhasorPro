export function complex(re, im) {
  return { re, im };
}

export function cAdd(a, b) {
  return complex(a.re + b.re, a.im + b.im);
}

export function cSub(a, b) {
  return complex(a.re - b.re, a.im - b.im);
}

export function cMul(a, b) {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

export function cConj(a) {
  return complex(a.re, -a.im);
}

export function cDiv(a, b) {
  const den = b.re * b.re + b.im * b.im;
  if (Math.abs(den) < 1e-12) return complex(0, 0);
  return complex(
    (a.re * b.re + a.im * b.im) / den,
    (a.im * b.re - a.re * b.im) / den,
  );
}

export function cInv(a) {
  return cDiv(complex(1, 0), a);
}

export function cMag(a) {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function cAngleDeg(a) {
  return (Math.atan2(a.im, a.re) * 180) / Math.PI;
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function polarToComplex(mag, angleDeg) {
  const a = degToRad(angleDeg);
  return complex(mag * Math.cos(a), mag * Math.sin(a));
}

export function complexToPolar(a) {
  return { mag: cMag(a), angle: cAngleDeg(a) };
}

export function fmtComplex(a, unit = "\u03a9") {
  const sign = a.im >= 0 ? "+" : "\u2212";
  return `${a.re.toFixed(2)} ${sign} j${Math.abs(a.im).toFixed(2)} ${unit}`;
}

export function fmtPolar(a, unit = "") {
  const p = complexToPolar(a);
  return `${p.mag.toFixed(2)}${unit}\u2220${p.angle.toFixed(2)}\u00b0`;
}
