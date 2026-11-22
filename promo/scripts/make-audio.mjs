// Synthesizes the promo's sound effects and music bed into public/sfx/*.wav.
// No samples, no deps: everything is built from sines and noise.
// Run: node scripts/make-audio.mjs   (re-run after tweaking anything here)
import { writeFileSync, mkdirSync } from 'node:fs'

const SR = 44100
const OUT = new URL('../public/sfx/', import.meta.url)
mkdirSync(OUT, { recursive: true })

let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const buf = (sec) => new Float32Array(Math.ceil(sec * SR))
const TAU = Math.PI * 2

function save(name, x, peak = 0.9) {
  let m = 0
  for (const v of x) m = Math.max(m, Math.abs(v))
  const g = m ? peak / m : 1
  const data = Buffer.alloc(x.length * 2)
  x.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * g)) * 32767), i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8)
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22)
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34)
  h.write('data', 36); h.writeUInt32LE(data.length, 40)
  writeFileSync(new URL(name, OUT), Buffer.concat([h, data]))
}

// Adds a sine whose frequency glides f0 -> f1 with exponential decay, starting at t0.
function tone(x, t0, dur, f0, f1, amp, decay) {
  let ph = 0
  const s0 = Math.floor(t0 * SR)
  for (let i = 0; i < dur * SR && s0 + i < x.length; i++) {
    const t = i / SR
    const f = f0 * Math.pow(f1 / f0, t / dur)
    ph += (TAU * f) / SR
    const atk = Math.min(1, t / 0.002)
    x[s0 + i] += Math.sin(ph) * amp * atk * Math.exp(-t / decay)
  }
}

// Noise burst through a one-pole low-pass (cutoff 0..1) minus an optional low band = band-ish.
function noise(x, t0, dur, amp, decay, lp = 0.5, hp = 0) {
  let a = 0, b = 0
  const s0 = Math.floor(t0 * SR)
  for (let i = 0; i < dur * SR && s0 + i < x.length; i++) {
    const n = rand()
    a += lp * (n - a)
    b += hp * (a - b)
    x[s0 + i] += (hp ? a - b : a) * amp * Math.exp(-(i / SR) / decay)
  }
}

// --- one-shots -------------------------------------------------------------------
{ const x = buf(0.08); noise(x, 0, 0.01, 1, 0.003, 0.9); tone(x, 0, 0.06, 3200, 2400, 0.6, 0.012); save('click.wav', x) }
{ const x = buf(0.2); tone(x, 0, 0.18, 950, 280, 1, 0.05); save('pop.wav', x) }
{ const x = buf(0.06); tone(x, 0, 0.05, 1800, 1500, 1, 0.01); save('tick.wav', x) }

function whoosh(name, dur, peakAt, boom) {
  const x = buf(dur)
  let a = 0
  for (let i = 0; i < x.length; i++) {
    const t = i / x.length
    const env = t < peakAt ? Math.pow(t / peakAt, 2) : Math.pow(1 - (t - peakAt) / (1 - peakAt), 1.5)
    a += (0.02 + 0.35 * env) * (rand() - a) // cutoff rides the envelope: dull -> bright -> dull
    x[i] = a * env
  }
  if (boom) tone(x, dur * peakAt, 0.5, 90, 40, 0.5, 0.18)
  save(name, x, 0.8)
}
whoosh('whoosh.wav', 0.45, 0.55)
whoosh('whoosh-big.wav', 0.7, 0.7, true)

{ // keyboard typing: ~20 keys over 1s, slightly irregular
  const x = buf(1.05)
  for (let k = 0; k < 20; k++) {
    const t = k * 0.05 + Math.abs(rand()) * 0.012
    noise(x, t, 0.025, 0.8, 0.006, 0.6, 0.2)
    tone(x, t, 0.02, 2200 + rand() * 400, 1800, 0.25, 0.006)
  }
  save('typing.wav', x, 0.7)
}

{ // sparkly rising chime for the logo reveal (C major arpeggio, high)
  const x = buf(1.8)
  ;[1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
    tone(x, i * 0.06, 1.6, f, f, 0.5, 0.5)
    tone(x, i * 0.06, 1.6, f * 2.01, f * 2.01, 0.12, 0.25)
  })
  save('chime.wav', x, 0.7)
}

{ // cartoon boing for the blob landing: pitch wobbles and settles
  const x = buf(0.5)
  let ph = 0
  for (let i = 0; i < x.length; i++) {
    const t = i / SR
    const f = 180 + 140 * Math.sin(TAU * 11 * t) * Math.exp(-t / 0.18) + 60 * Math.exp(-t / 0.05)
    ph += (TAU * f) / SR
    x[i] = Math.sin(ph) * Math.exp(-t / 0.16) * Math.min(1, t / 0.003)
  }
  save('boing.wav', x)
}

{ // burst: a noisy thump plus a scatter of tiny pops
  const x = buf(0.5)
  noise(x, 0, 0.2, 1, 0.04, 0.4)
  tone(x, 0, 0.25, 160, 50, 0.8, 0.07)
  for (let k = 0; k < 9; k++) {
    const f = 700 + Math.abs(rand()) * 1400
    tone(x, 0.02 + Math.abs(rand()) * 0.22, 0.08, f, f * 0.4, 0.35, 0.02)
  }
  save('burst.wav', x)
}

// --- music bed: 120 bpm, Fmaj7 Em7 Dm7 Cmaj7, drums enter on beat 5 -----------------
{
  const LEN = 27, BEAT = 0.5 // keep >= video length (Promo.jsx DURATION / 30)
  const x = buf(LEN)
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12)
  const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
  const beats = Math.floor(LEN / BEAT)
  for (let b = 0; b < beats; b++) {
    const t = b * BEAT
    const ch = CHORDS[Math.floor(b / 4) % 4]
    // soft electric-piano stabs on the beat and the "and"
    for (const off of [0, 0.25]) for (const m of ch) {
      tone(x, t + off, 0.45, hz(m + 12), hz(m + 12), off ? 0.05 : 0.08, 0.16)
      tone(x, t + off, 0.3, hz(m + 24), hz(m + 24), 0.015, 0.06)
    }
    if (b % 2 === 0) tone(x, t, 0.45, hz(ch[0] - 12), hz(ch[0] - 12), 0.35, 0.3) // bass
    if (b < 5) continue
    if (b % 2 === 0) tone(x, t, 0.3, 130, 45, 0.9, 0.09) // kick
    else noise(x, t, 0.18, 0.35, 0.05, 0.5, 0.3) // clap-ish snare
    noise(x, t + 0.25, 0.05, 0.25, 0.012, 0.95, 0.6) // offbeat hat
  }
  for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 1.2) // gentle glue
  save('music.wav', x, 0.85)
}

console.log('wrote', new URL('.', OUT).pathname)
