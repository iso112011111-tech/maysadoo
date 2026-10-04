"use client";

import { useEffect } from "react";
import { soundEnabled, startAmbient, stopAmbient, subscribeSound } from "@/lib/sfx";

/**
 * Background soundscape for the reading pages. Browsers block audio until the visitor interacts,
 * so it starts on the first tap/click, follows the sound toggle, and pauses while the tab is hidden.
 */
export default function Ambience() {
  useEffect(() => {
    let unlocked = false;
    const start = () => {
      unlocked = true;
      if (soundEnabled() && !document.hidden) startAmbient();
    };
    const onVisibility = () => (document.hidden ? stopAmbient() : unlocked && start());
    const unsubscribe = subscribeSound(() => unlocked && soundEnabled() && startAmbient());

    addEventListener("pointerdown", start);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      removeEventListener("pointerdown", start);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
      stopAmbient();
    };
  }, []);

  return null;
}
