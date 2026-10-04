"use client";

/**
 * Card sound effects synthesised live with the Web Audio API — no audio files, no licences.
 * Everything runs through one shared reverb so it sounds like a single dim, echoing room.
 * Browsers only allow sound after a user gesture, and every effect here is triggered by one.
 */

const PREF_KEY = "duduang:sound";
let ctx: AudioContext | null = null;
let master: GainNode;
let reverb: ConvolverNode;
let enabled = true;
const listeners = new Set<() => void>();

try {
  enabled = localStorage.getItem(PREF_KEY) !== "off";
} catch {
  // storage blocked: sound stays on for this visit
}

/* ---------------------------------------------------------------- on/off (for useSyncExternalStore) */

export const soundEnabled = () => enabled;
export const soundServerSnapshot = () => true;
export function subscribeSound(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {}
  if (!on) stopAmbient();
  listeners.forEach((fn) => fn());
  if (on) sfxTick();
}

/* ---------------------------------------------------------------- engine */

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.75;
    master.connect(ctx.destination);
    // dark hall reverb from decaying noise
    reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 3);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.45;
    reverb.connect(wet).connect(master);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

const out = (node: AudioNode, rev = 0.3) => {
  node.connect(master);
  if (rev > 0) {
    const send = ctx!.createGain();
    send.gain.value = rev;
    node.connect(send).connect(reverb);
  }
};

let noiseBuf: AudioBuffer | null = null;
function noise(ac: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}

/** Short filtered noise burst — the basic "card stock" sound. */
function paper(at: number, dur: number, freq: number, q: number, gain: number, rev = 0.15) {
  const ac = ctx!;
  const src = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(bp).connect(g);
  out(g, rev);
  src.start(at, Math.random() * 1.5, dur + 0.05);
}

function tone(at: number, freq: number, dur: number, gain: number, rev = 0.5, type: OscillatorType = "sine") {
  const ac = ctx!;
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  out(g, rev);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function thud(at: number, gain = 0.3) {
  const ac = ctx!;
  const o = ac.createOscillator();
  o.frequency.setValueAtTime(140, at);
  o.frequency.exponentialRampToValueAtTime(55, at + 0.12);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  o.connect(g);
  out(g, 0.1);
  o.start(at);
  o.stop(at + 0.2);
}

/* ---------------------------------------------------------------- effects */

/** Tiny tick for UI choices (spread / topic). */
export function sfxTick() {
  if (!enabled) return;
  const t = audio().currentTime;
  paper(t, 0.03, 4200, 2, 0.12, 0.05);
  tone(t, 1760, 0.12, 0.015, 0.2);
}

/** Riffle shuffle: card edges flicking past each other, then the bridge settling. Lasts ~1.5 s. */
export function sfxShuffle() {
  if (!enabled) return;
  const t0 = audio().currentTime + 0.05;
  for (let r = 0; r < 2; r++) {
    const start = t0 + r * 0.7;
    for (let i = 0; i < 20; i++) paper(start + i * 0.02 + Math.random() * 0.008, 0.03, 2800 + Math.random() * 2200, 1.2, 0.16 + Math.random() * 0.08);
    paper(start + 0.45, 0.14, 900, 0.8, 0.2);
    thud(start + 0.5, 0.16);
  }
}

/** Soft whisper as the pointer runs along the fanned deck. Throttled so a fast sweep stays quiet. */
let lastHover = 0;
export function sfxHover() {
  if (!enabled || !ctx) return; // never the first sound: needs an earlier gesture
  const now = performance.now();
  if (now - lastHover < 45) return;
  lastHover = now;
  paper(ctx.currentTime, 0.025, 3000 + Math.random() * 1500, 1.5, 0.05, 0.05);
}

/** A card slid out of the fan and laid down in its slot. */
export function sfxPick() {
  if (!enabled) return;
  const ac = audio();
  const t = ac.currentTime;
  const src = noise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(3600, t + 0.3);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
  src.connect(bp).connect(g);
  out(g, 0.3);
  src.start(t, 0, 0.42);
  paper(t + 0.36, 0.1, 1200, 0.6, 0.14);
  thud(t + 0.4, 0.22);
}

/** Turning a card over: a crisp snap and a bell — bright for upright, darker minor for reversed. */
export function sfxFlip(reversed = false) {
  if (!enabled) return;
  const t = audio().currentTime;
  paper(t, 0.06, 3200, 0.9, 0.32, 0.1);
  const root = reversed ? 220 : 261.63;
  const steps = reversed ? [1, 1.189, 1.498, 2] : [1, 1.26, 1.498, 2];
  steps.forEach((m, i) => {
    tone(t + 0.08 + i * 0.07, root * m * 2, 2.2, 0.06, 0.8);
    tone(t + 0.08 + i * 0.07, root * m * 4.01, 1.2, 0.018, 0.8);
  });
}

/** Deep singing-bowl gong when the full reading is ready. */
export function sfxGong() {
  if (!enabled) return;
  const t = audio().currentTime + 0.05;
  [1, 1.47, 2.09, 2.56, 3.17].forEach((m, i) => tone(t, 82 * m, 5 - i * 0.6, 0.11 / (i + 1), 0.9));
  thud(t, 0.35);
}

/* ---------------------------------------------------------------- ambience */

let amb: { gain: GainNode; stop: () => void } | null = null;
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];

/** Low meditative drone + slow wind + a distant bell now and then. Fades in; call stopAmbient() to fade out. */
export function startAmbient() {
  if (!enabled || amb) return;
  const ac = audio();
  const t = ac.currentTime;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.5, t + 4);
  out(gain, 0.4);

  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  lp.connect(gain);

  // drone: root, fifth and a slightly detuned octave, breathing with a very slow LFO
  const oscs = [55, 82.41, 110.6].map((f, i) => {
    const o = ac.createOscillator();
    o.type = i === 1 ? "triangle" : "sine";
    o.frequency.value = f;
    const g = ac.createGain();
    g.gain.value = [0.16, 0.06, 0.07][i];
    const lfo = ac.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.03;
    const depth = ac.createGain();
    depth.gain.value = g.gain.value * 0.6;
    lfo.connect(depth).connect(g.gain);
    o.connect(g).connect(lp);
    o.start(t);
    lfo.start(t);
    return [o, lfo];
  });

  // wind: looping noise through a wandering band-pass
  const wind = noise(ac);
  wind.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  bp.Q.value = 0.7;
  const wg = ac.createGain();
  wg.gain.value = 0.035;
  const wlfo = ac.createOscillator();
  wlfo.frequency.value = 0.08;
  const wdepth = ac.createGain();
  wdepth.gain.value = 260;
  wlfo.connect(wdepth).connect(bp.frequency);
  wind.connect(bp).connect(wg).connect(gain);
  wind.start(t);
  wlfo.start(t);

  // distant bells at random intervals
  let timer: ReturnType<typeof setTimeout>;
  const bell = () => {
    if (amb && ctx) {
      const at = ctx.currentTime;
      const f = PENTA[Math.floor(Math.random() * PENTA.length)];
      tone(at, f, 4.5, 0.018, 0.95);
      tone(at, f * 2.76, 2, 0.005, 0.95);
    }
    timer = setTimeout(bell, 6000 + Math.random() * 7000);
  };
  timer = setTimeout(bell, 3000);

  amb = {
    gain,
    stop: () => {
      clearTimeout(timer);
      const now = ac.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      const end = now + 1.6;
      oscs.flat().forEach((o) => o.stop(end));
      wind.stop(end);
      wlfo.stop(end);
    },
  };
}

export function stopAmbient() {
  amb?.stop();
  amb = null;
}

/** Shimmer that rises as a card is lifted into the spotlight. */
export function sfxReveal() {
  if (!enabled) return;
  const t = audio().currentTime;
  [1, 1.5, 2, 3].forEach((m, i) => tone(t + i * 0.09, 392 * m, 1.8 - i * 0.2, 0.025, 0.9));
}

/** Shared context for other audio (แม่หมอ's voice) so everything mixes in one graph. */
export const audioContext = () => audio();
export const masterOut = () => {
  audio();
  return master;
};

/** Lower the ambience while แม่หมอ speaks. */
export function duckAmbient(on: boolean) {
  if (!amb || !ctx) return;
  const now = ctx.currentTime;
  amb.gain.gain.cancelScheduledValues(now);
  amb.gain.gain.setTargetAtTime(on ? 0.12 : 0.5, now, 0.4);
}
