/**
 * Small, soft interface sounds, synthesised with Web Audio so there are no files to load.
 * Nothing plays until the visitor presses Enter (browsers require a gesture first).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = readPref();
const listeners = new Set<() => void>();

function readPref() {
  try {
    return localStorage.getItem("sound") !== "off";
  } catch {
    return true;
  }
}

export const isSoundOn = () => enabled;

export function onSoundChange(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function toggleSound() {
  enabled = !enabled;
  try {
    localStorage.setItem("sound", enabled ? "on" : "off");
  } catch {
    /* private mode: the choice just isn't remembered */
  }
  listeners.forEach((l) => l());
  if (enabled) sfx.click();
}

/** Create the audio graph; call from a click or key press. Resolves once sound can play. */
export function unlockAudio(): Promise<void> {
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return Promise.resolve();
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
    // One second of soft noise, reused for rustles and whooshes.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return ctx.resume();
}

function ready() {
  return enabled && ctx && master && ctx.state === "running" ? ctx : null;
}

/** A sine (or triangle) note with a quick attack and a smooth fade. */
interface ToneOptions {
  at?: number;
  dur?: number;
  gain?: number;
  /** Glide to this pitch over the note. */
  to?: number;
  type?: OscillatorType;
}

function tone(freq: number, { at = 0, dur = 0.12, gain = 0.04, to, type = "sine" }: ToneOptions = {}) {
  const c = ready();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Filtered noise: paper rustles and air. */
function hiss({ at = 0, dur = 0.4, gain = 0.05, freq = 2500, q = 0.7, sweepTo }: {
  at?: number; dur?: number; gain?: number; freq?: number; q?: number; sweepTo?: number;
}) {
  const c = ready();
  if (!c || !master || !noise) return;
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (sweepTo) {
    filter.frequency.exponentialRampToValueAtTime(sweepTo, t + dur * 0.5);
    filter.frequency.exponentialRampToValueAtTime(freq, t + dur);
  }
  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(gain, t + dur * 0.3);
  env.gain.linearRampToValueAtTime(0, t + dur);
  src.connect(filter).connect(env).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

/** C major pentatonic, C5 upward: soft and never clashing. */
const ROOM_NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

let lastHover = 0;

export const sfx = {
  /** A soft tick when the pointer reaches something clickable. */
  hover() {
    const now = performance.now();
    if (now - lastHover < 60) return;
    lastHover = now;
    tone(1320, { dur: 0.06, gain: 0.018, to: 1180 });
  },
  /** A gentle tap. */
  click() {
    tone(620, { dur: 0.11, gain: 0.045, to: 420, type: "triangle" });
  },
  /** Paper lifting as the cover swings open, then settling. */
  open() {
    hiss({ dur: 0.55, gain: 0.05, freq: 2600, q: 0.6 });
    hiss({ at: 0.35, dur: 0.6, gain: 0.03, freq: 1800, q: 0.8 });
    tone(140, { at: 1.15, dur: 0.22, gain: 0.07, to: 80 });
  },
  /** The cover folding back down. */
  close() {
    hiss({ dur: 0.45, gain: 0.04, freq: 2200, q: 0.7 });
    tone(120, { at: 0.75, dur: 0.2, gain: 0.07, to: 70 });
  },
  /**
   * A soft bell as the next room arrives. Each room has its own note on a pentatonic
   * scale, so walking right climbs a gentle melody and walking back comes down it.
   */
  slide(room: number) {
    const freq = ROOM_NOTES[room % ROOM_NOTES.length];
    tone(freq, { at: 0.35, dur: 1.8, gain: 0.032 });
    tone(freq * 2, { at: 0.35, dur: 0.9, gain: 0.008 });
    tone(freq / 2, { at: 0.35, dur: 1.4, gain: 0.012 });
  },
  /** Two soft notes on entering. */
  enter() {
    tone(523.25, { dur: 1.2, gain: 0.035 });
    tone(783.99, { at: 0.12, dur: 1.4, gain: 0.03 });
  },
};
