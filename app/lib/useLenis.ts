"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { ScrollTrigger, gsap } from "./gsap";

/**
 * Smooth scrolling driven by the GSAP ticker so Lenis and ScrollTrigger share
 * one clock — two independent rAF loops make pinned/scrubbed timelines jitter.
 */
export function useLenis(enabled: boolean) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      // Native momentum on touch feels better than an emulated one.
      syncTouch: false,
    });
    lenisRef.current = lenis;

    const update = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return lenisRef;
}
