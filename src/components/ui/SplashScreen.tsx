"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SPLASH_DURATION = 5000;
const LETTERS = ["T", "R", "O", "N"];

export default function SplashScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const glowRef = useRef<HTMLDivElement>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const letters = letterRefs.current.filter(Boolean) as HTMLSpanElement[];
    const glow = glowRef.current;
    const container = containerRef.current;
    if (letters.length === 0 || !glow || !container) return;

    // All letters start invisible
    gsap.set(letters, { opacity: 0, scale: 0.6, y: 20 });
    gsap.set(glow, { opacity: 0 });

    const tl = gsap.timeline();

    // ── Letter-by-letter reveal (0.6s → 3.4s) ──
    // Each letter fades in, scales up, and settles into place.
    // Staggered at 0.7s intervals for a measured, deliberate reveal.
    letters.forEach((letter, i) => {
      const startTime = 0.6 + i * 0.7;

      // Letter appears
      tl.to(
        letter,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        startTime
      );

      // Individual letter glow intensifies on arrival
      tl.to(
        letter,
        {
          textShadow:
            "0 0 10px rgba(0,212,255,0.9), 0 0 30px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.25)",
          duration: 0.4,
          ease: "power1.in",
        },
        startTime + 0.3
      );
    });

    // ── Full illumination pulse (3.6s → 4.4s) ──
    // After all letters are in place, a brighter glow washes across
    // the whole word — the "power-on" moment.
    tl.to(
      letters,
      {
        textShadow:
          "0 0 15px rgba(0,212,255,1), 0 0 40px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.35), 0 0 120px rgba(0,212,255,0.15)",
        duration: 0.5,
        ease: "power2.in",
      },
      3.6
    );

    // Background radial glow behind the text
    tl.to(
      glow,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power1.in",
      },
      3.6
    );

    // Settle back to normal glow after the pulse
    tl.to(
      letters,
      {
        textShadow:
          "0 0 10px rgba(0,212,255,0.9), 0 0 30px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.25)",
        duration: 0.4,
        ease: "power2.out",
      },
      4.1
    );

    tl.to(
      glow,
      {
        opacity: 0.4,
        duration: 0.4,
        ease: "power2.out",
      },
      4.1
    );

    // ── Coordinated exit ──
    // Wait for BOTH the animation timer AND hero content readiness.
    // Safety valve at 8s prevents permanent splash.
    let animDone = false;
    let heroLoaded = (window as any).__heroReady === true;
    let exited = false;

    const runExit = () => {
      if (exited || !animDone || !heroLoaded) return;
      exited = true;

      gsap.to(container, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
          document.body.style.overflow = "";
          setRemoved(true);

          // body.overflow was "hidden" during the entire splash.
          // Lenis and ScrollTrigger both calculated scroll bounds
          // while the page was non-scrollable, so their pin spacers
          // and scroll limits are stale. Force a full recalculation
          // after the DOM reflows with overflow restored.
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
            // Resize event triggers Lenis internal recalculation
            window.dispatchEvent(new Event("resize"));
          });
        },
      });
    };

    const animTimerId = setTimeout(() => {
      animDone = true;
      runExit();
    }, SPLASH_DURATION);

    const onHeroReady = () => {
      heroLoaded = true;
      runExit();
    };
    window.addEventListener("hero-ready", onHeroReady);

    if ((window as any).__heroReady === true) {
      heroLoaded = true;
    }

    // Safety valve
    const safetyTimerId = setTimeout(() => {
      animDone = true;
      heroLoaded = true;
      runExit();
    }, SPLASH_DURATION + 3000);

    return () => {
      tl.kill();
      clearTimeout(animTimerId);
      clearTimeout(safetyTimerId);
      window.removeEventListener("hero-ready", onHeroReady);
      document.body.style.overflow = "";
    };
  }, []);

  if (removed) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Radial glow behind text */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(500px, 90vw)",
          height: "min(500px, 90vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 40%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* TRON letters */}
      <div
        style={{
          display: "flex",
          gap: "clamp(0.15em, 3vw, 0.4em)",
          fontFamily: "var(--font-orbitron), system-ui, sans-serif",
          fontSize: "clamp(3rem, 10vw, 7rem)",
          fontWeight: 900,
          letterSpacing: "clamp(0.15em, 2vw, 0.35em)",
          color: "#00d4ff",
          whiteSpace: "nowrap",
          zIndex: 1,
        }}
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            style={{
              display: "inline-block",
              opacity: 0,
              textShadow: "none",
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
