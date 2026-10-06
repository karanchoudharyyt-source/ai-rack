// Synthesizes the soundtrack for the demo cut: a slow ambient pad, a whoosh + low hit on each
// take-apart step, soft ticks for captions, and a data "zip" + chime every time the token lands.
// Usage: node audio.js out.wav
const fs = require('fs');
const SR = 48000, DUR = 33, N = DUR * SR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7331;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
function biquad(type, f, q = 0.707) {
  const w = 2 * Math.PI * f / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a, k = [b0 / a0, b1 / a0, b2 / a0, -2 * c / a0, (1 - a) / a0];
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = k[0] * x + k[1] * x1 + k[2] * x2 - k[3] * y1 - k[4] * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
const add = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };

// pad: A minor-ish chord of detuned saws through a slowly opening low-pass, chord shifts per step
const CHORDS = [[0, 9.6], [110, 130.8, 164.8, 220], [9.6, 21.6], [98, 123.5, 146.8, 196], [21.6, 27], [87.3, 110, 130.8, 174.6], [27, 33], [110, 138.6, 164.8, 220]];
{
  const fl = biquad('lp', 900, 0.9), fr = biquad('lp', 900, 0.9);
  const ph = new Float64Array(16).map(() => rnd());
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    let notes;
    for (let c = 0; c < CHORDS.length; c += 2) if (t >= CHORDS[c][0]) notes = CHORDS[c + 1];
    let l = 0, r = 0;
    notes.forEach((f, k) => {
      for (const [d, side] of [[0.997, 0], [1.003, 1]]) {
        const j = k * 2 + side;
        ph[j] = (ph[j] + f * d / SR) % 1;
        const v = (ph[j] * 2 - 1) * 0.05;
        if (side) r += v; else l += v;
      }
    });
    const env = smooth(t / 2.5) * (1 - smooth((t - 31.4) / 1.6));
    const g = 0.55 + 0.25 * Math.sin(t * 0.7);
    L[i] += fl(l) * env * g; R[i] += fr(r) * env * g;
  }
}
// sub pulse, a slow heartbeat that speeds up for the token section
{
  for (let t = 1.2; t < 32; t += t < 27 ? 1.3 : 0.65) {
    const s = Math.floor(t * SR);
    for (let k = 0; k < SR * 0.4; k++) {
      const u = k / SR, f = 55 * (1 + 0.6 * Math.exp(-u * 30));
      const v = Math.sin(2 * Math.PI * f * u) * Math.exp(-u * 9) * 0.22 * smooth(t / 3);
      add(s + k, v, v);
    }
  }
}
// transitions: filtered-noise whoosh rising into a low hit where each step lands
const STEPS = [[2.6, 4.0], [6.6, 8.2], [10.6, 12.4], [15.0, 16.8], [19.6, 21.6], [24.8, 27.0]];
for (const [a, b] of STEPS) {
  // state-variable band-pass so the cutoff can sweep without clicks
  const dur = b - a + 0.6, s0 = Math.floor(a * SR);
  let lo = 0, band = 0;
  for (let k = 0; k < dur * SR; k++) {
    const u = k / SR / dur;
    const fc = 2 * Math.sin(Math.PI * (300 + 3200 * Math.sin(Math.PI * u)) / SR);
    const x = rnd() * 2 - 1;
    lo += fc * band; const hi = x - lo - 0.8 * band; band += fc * hi;
    const v = band * Math.sin(Math.PI * u) ** 2 * 0.5;
    const pan = Math.sin(Math.PI * u * 2) * 0.5;
    add(s0 + k, v * (1 - pan), v * (1 + pan));
  }
  // whoosh filter is static above; add a pitched sweep for movement
  for (let k = 0; k < (b - a) * SR; k++) {
    const u = k / SR, uu = u / (b - a);
    const v = Math.sin(2 * Math.PI * (180 + 500 * uu * uu) * u) * Math.sin(Math.PI * uu) * 0.035;
    add(s0 + k, v, v);
  }
  const h = Math.floor(b * SR);
  for (let k = 0; k < SR * 0.9; k++) {
    const u = k / SR, f = 46 + 70 * Math.exp(-u * 18);
    const v = Math.sin(2 * Math.PI * f * u) * Math.exp(-u * 4) * 0.55 + (rnd() * 2 - 1) * Math.exp(-u * 60) * 0.08;
    add(h + k, v, v);
  }
}
// caption ticks
for (const t of [0.05, 4.0, 8.2, 12.4, 16.8, 21.6, 27.0, 30.6]) {
  const s = Math.floor(t * SR);
  for (let k = 0; k < SR * 0.08; k++) { const u = k / SR, v = Math.sin(2 * Math.PI * 2400 * u) * Math.exp(-u * 70) * 0.09; add(s + k, v * 0.8, v); }
}
// token: rising zip while it travels, a bell chime when it lands (period 2.6 s, lands at u = 0.97)
for (let n = 0; n < 3; n++) {
  const start = 27 + n * 2.6, land = start + 0.97 * 2.6;
  if (land > 33) break;
  for (let k = 0; k < 2.5 * SR; k++) {
    const u = k / SR, uu = u / 2.5;
    const v = Math.sin(2 * Math.PI * (600 + 1400 * uu) * u) * 0.018 * Math.sin(Math.PI * uu);
    add(Math.floor(start * SR) + k, v * (1 - uu), v * uu);
  }
  for (let k = 0; k < SR * 1.6; k++) {
    const u = k / SR;
    const v = (Math.sin(2 * Math.PI * 880 * u) + 0.5 * Math.sin(2 * Math.PI * 1320 * u) + 0.25 * Math.sin(2 * Math.PI * 2640 * u)) * Math.exp(-u * 3.2) * 0.12;
    add(Math.floor(land * SR) + k, v, v);
  }
}
// normalize peak, write 16-bit stereo WAV
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4);
}
fs.writeFileSync(process.argv[2] || 'soundtrack.wav', buf);
console.log('peak', peak.toFixed(3));
