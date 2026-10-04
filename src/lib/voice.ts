"use client";

import type { VoiceLine } from "./spreads";
import { audioContext, duckAmbient, masterOut } from "./sfx";

/**
 * แม่หมอ's voice player: plays server-made MP3 lines one after another (the next line is preloaded),
 * routes them through an analyser so visuals can follow her voice, and ducks the ambience meanwhile.
 */

const PREF_KEY = "duduang:voice";
let enabled = true;
const listeners = new Set<() => void>();
try {
  enabled = localStorage.getItem(PREF_KEY) !== "off";
} catch {}

export const voiceEnabled = () => enabled;
export const voiceServerSnapshot = () => true;
export function subscribeVoice(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function setVoiceEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {}
  if (!on) stopVoice();
  listeners.forEach((fn) => fn());
}

let analyser: AnalyserNode | null = null;
let data: Uint8Array<ArrayBuffer> | null = null;
let current: HTMLAudioElement | null = null;
let run = 0;

function graph() {
  if (!analyser) {
    const ac = audioContext();
    analyser = ac.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.7;
    analyser.connect(masterOut());
    data = new Uint8Array(new ArrayBuffer(analyser.fftSize));
  }
  return analyser;
}

/** Loudness of her voice right now, 0 … 1 (for visuals). */
export function voiceLevel() {
  if (!analyser || !data || !current) return 0;
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 4);
}

export const isSpeaking = () => !!current;

/** a speech waiting for the browser to allow sound (first tap / key press) */
let waiting: (() => void) | null = null;
const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

function cancelWaiting() {
  if (!waiting) return;
  GESTURES.forEach((g) => removeEventListener(g, waiting!, true));
  waiting = null;
}

export function stopVoice() {
  cancelWaiting();
  run++;
  if (current) {
    current.pause();
    current.src = "";
    current = null;
  }
  duckAmbient(false);
}

type Opts = { onLine?: (i: number) => void; onEnd?: () => void };
type Result = "done" | "stopped" | "blocked";

/** Browsers keep audio locked until the visitor has interacted with the page. */
async function unlocked() {
  const ac = audioContext();
  if (ac.state !== "running") await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
  return ac.state === "running";
}

/**
 * Speak automatically. If the browser still blocks sound (no tap on this page yet),
 * wait and start the moment the visitor first taps or presses a key.
 */
export async function speak(lines: VoiceLine[], opts: Opts = {}) {
  const r = await speakLines(lines, opts);
  if (r !== "blocked") return;
  cancelWaiting();
  waiting = () => {
    cancelWaiting();
    speakLines(lines, opts);
  };
  GESTURES.forEach((g) => addEventListener(g, waiting!, { capture: true, once: true }));
}

/** Speak the lines in order. */
export async function speakLines(lines: VoiceLine[], opts: Opts = {}): Promise<Result> {
  stopVoice();
  if (!enabled || !lines.length) {
    opts.onEnd?.();
    return "done";
  }
  const me = ++run;
  if (!(await unlocked())) return "blocked";
  if (me !== run) return "stopped";
  const node = graph();
  duckAmbient(true);
  const make = (url: string) => {
    const a = new Audio(url);
    a.preload = "auto";
    return a;
  };
  let next = make(lines[0].url);
  for (let i = 0; i < lines.length; i++) {
    if (me !== run) return "stopped";
    const a = next;
    if (i + 1 < lines.length) next = make(lines[i + 1].url); // start fetching (and generating) the next line
    current = a;
    audioContext().createMediaElementSource(a).connect(node);
    opts.onLine?.(i);
    const ok = await new Promise<boolean | "blocked">((resolve) => {
      a.onended = () => resolve(true);
      a.onerror = () => resolve(false);
      a.play().catch((e: Error) => resolve(e?.name === "NotAllowedError" ? "blocked" : false));
    });
    if (ok === "blocked" && me === run) {
      current = null;
      duckAmbient(false);
      return "blocked";
    }
    if (!ok && me === run) break;
  }
  if (me !== run) return "stopped";
  current = null;
  duckAmbient(false);
  opts.onEnd?.();
  return "done";
}
