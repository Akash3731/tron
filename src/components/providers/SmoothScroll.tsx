"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Always start from the top — prevents browser scroll restoration
    // from landing mid-video on refresh
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const isTouchPrimary = window.matchMedia("(pointer: coarse)").matches;

    if (isTouchPrimary) {
      // ── Mobile / touch devices ──
      // Skip Lenis entirely — it intercepts touch events and adds lerp
      // that makes pin+scrub ScrollTrigger sluggish / non-functional.
      // Instead, use GSAP's built-in touch normalizer (GTA 6 approach):
      // prevents iOS rubber-banding, normalizes touch velocity, and
      // ensures pin+scrub works reliably with native swipe gestures.
      ScrollTrigger.normalizeScroll(true);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      });

      return () => {
        cancelAnimationFrame(rafId);
        ScrollTrigger.normalizeScroll(false);
      };
    }

    // ── Desktop ──
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    // Pipe every Lenis scroll tick into ScrollTrigger so trigger
    // positions stay accurate with the interpolated scroll value
    lenis.on("scroll", ScrollTrigger.update);

    // Let GSAP's ticker drive Lenis — single rAF loop, no drift
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // After SSR hydration the DOM settles over a couple of frames
    // (fonts load, external images resolve, layout shifts).
    // Refresh ScrollTrigger once the layout is stable so every
    // pin spacer height and trigger position is correct.
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
