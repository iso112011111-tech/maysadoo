"use client";

import { useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionClass = new () => Recognition;

const Impl = () =>
  typeof window === "undefined"
    ? null
    : ((window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionClass }).webkitSpeechRecognition ??
      null);
const noop = () => () => {};

/** Talk instead of typing: Thai speech recognition built into the browser (Chrome, Edge, Safari). */
export function useDictation(onText: (text: string, final: boolean) => void) {
  const supported = useSyncExternalStore(noop, () => !!Impl(), () => false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  function start() {
    const C = Impl();
    if (!C || listening) return;
    const r = new C();
    r.lang = "th-TH";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let text = "";
      let final = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        final = e.results[i].isFinal;
      }
      onText(text, final);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  function stop() {
    rec.current?.stop();
  }

  return { supported, listening, start, stop };
}
