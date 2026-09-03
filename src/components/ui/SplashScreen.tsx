"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ─── Config ────────────────────────────────────────────────────
const SPLASH_DURATION = 5000;
const FRAG_COLS = 14;
const FRAG_ROWS = 9;
const PARTICLE_COUNT = 28;

// Light cycle battle paths (viewBox 0 0 1920 1080)
// Rules: trails NEVER cross — cycles race in opposite zones,
// getting dangerously close but never touching.
// One crossing point only: center (960,540) = the fatal collision.

// Cyan: races through the UPPER zone (y < 540)
const PATH_CYAN =
  "M -50,750 C 80,700 150,50 350,70" +
  " C 550,90 480,480 680,460" +
  " C 880,440 920,40 1120,70" +
  " C 1320,100 1280,430 1450,400" +
  " C 1620,370 1480,200 1280,240" +
  " C 1080,280 1020,470 960,540";

// Orange: races through the LOWER zone (y > 540)
const PATH_ORANGE =
  "M 1970,330 C 1840,380 1770,1030 1570,1010" +
  " C 1370,990 1440,600 1240,620" +
  " C 1040,640 1000,1040 800,1010" +
  " C 600,980 640,650 470,680" +
  " C 300,710 440,880 640,840" +
  " C 840,800 900,610 960,540";

// Collision particles — alternating cyan/orange
const collisionParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
  const radius = 100 + (i % 5) * 45;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    color: i % 2 === 0 ? "#00d4ff" : "#ff6b00",
    size: 2 + (i % 3),
  };
});

// Derezz fragment grid
const fragments = Array.from(
  { length: FRAG_COLS * FRAG_ROWS },
  (_, i) => ({
    col: i % FRAG_COLS,
    row: Math.floor(i / FRAG_COLS),
  })
);

// ─── Bike orientation helper ───────────────────────────────────
// Top-down view is symmetric — just translate + rotate to follow path.
function getBikeTransform(
  path: SVGPathElement,
  drawn: number,
  totalLen: number
): string {
  const pt = path.getPointAtLength(drawn);
  const ptAhead = path.getPointAtLength(Math.min(drawn + 2, totalLen));
  const angle =
    Math.atan2(ptAhead.y - pt.y, ptAhead.x - pt.x) * (180 / Math.PI);
  return `translate(${pt.x},${pt.y}) rotate(${angle})`;
}

// ─── Light Cycle SVG (top-down / bird's-eye, facing right, origin at center) ──
function LightCycleBike({ color }: { color: string }) {
  return (
    <>
      {/* ── Outer body shell — elongated bullet from above ── */}
      <path
        d="M -28,0 C -28,-7 -18,-10 -4,-11 C 12,-11 26,-8 34,-3 C 37,0 34,3 26,8 C 12,11 -4,11 -18,10 C -28,7 -28,0 Z"
        fill={color}
        fillOpacity={0.08}
        stroke={color}
        strokeWidth={1}
      />

      {/* ── Inner body panel — recessed surface ── */}
      <path
        d="M -22,0 C -22,-5 -14,-8 -2,-8.5 C 12,-8.5 22,-6 28,-2 C 30,0 28,2 22,6 C 12,8.5 -2,8.5 -14,8 C -22,5 -22,0 Z"
        fill={color}
        fillOpacity={0.04}
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.3}
      />

      {/* ── Canopy dome — raised elliptical section ── */}
      <ellipse
        cx="3"
        cy="0"
        rx="12"
        ry="6.5"
        fill={color}
        fillOpacity={0.06}
        stroke={color}
        strokeWidth={0.8}
        strokeOpacity={0.5}
      />

      {/* ── Canopy inner glass ── */}
      <ellipse
        cx="5"
        cy="0"
        rx="8"
        ry="4"
        fill={color}
        fillOpacity={0.03}
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.3}
      />

      {/* ── Rider shadow (hunched forward) ── */}
      <ellipse
        cx="6"
        cy="0"
        rx="4"
        ry="2.2"
        fill={color}
        fillOpacity={0.1}
      />

      {/* ── Center light strip — main horizontal glow ── */}
      <line
        x1="-25"
        y1="0"
        x2="33"
        y2="0"
        stroke={color}
        strokeWidth={1.4}
        strokeOpacity={0.9}
      />

      {/* ── Front wheel (top-down = perpendicular slab) ── */}
      <rect
        x="27"
        y="-4.5"
        width="2.5"
        height="9"
        rx={0.8}
        fill={color}
        fillOpacity={0.35}
        stroke={color}
        strokeWidth={0.6}
      />

      {/* ── Rear wheel (top-down = perpendicular slab) ── */}
      <rect
        x="-27"
        y="-4.5"
        width="2.5"
        height="9"
        rx={0.8}
        fill={color}
        fillOpacity={0.35}
        stroke={color}
        strokeWidth={0.6}
      />

      {/* ── Side panel lines (upper) ── */}
      <path
        d="M -18,-8 L 14,-8 L 22,-5"
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.35}
      />
      {/* ── Side panel lines (lower) ── */}
      <path
        d="M -18,8 L 14,8 L 22,5"
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.35}
      />

      {/* ── Circuit detail lines (upper body) ── */}
      <path
        d="M -10,-5 L 5,-5 L 8,-2"
        fill="none"
        stroke={color}
        strokeWidth={0.4}
        strokeOpacity={0.25}
      />
      {/* ── Circuit detail lines (lower body) ── */}
      <path
        d="M -10,5 L 5,5 L 8,2"
        fill="none"
        stroke={color}
        strokeWidth={0.4}
        strokeOpacity={0.25}
      />

      {/* ── Engine intake vents (rear, upper) ── */}
      <line x1="-14" y1="-7" x2="-14" y2="-4" stroke={color} strokeWidth={0.5} strokeOpacity={0.3} />
      <line x1="-17" y1="-6.5" x2="-17" y2="-4" stroke={color} strokeWidth={0.5} strokeOpacity={0.25} />
      {/* ── Engine intake vents (rear, lower) ── */}
      <line x1="-14" y1="7" x2="-14" y2="4" stroke={color} strokeWidth={0.5} strokeOpacity={0.3} />
      <line x1="-17" y1="6.5" x2="-17" y2="4" stroke={color} strokeWidth={0.5} strokeOpacity={0.25} />

      {/* ── Front nose point — sharp leading edge ── */}
      <path
        d="M 30,-2.5 L 37,0 L 30,2.5"
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={0.6}
        strokeOpacity={0.6}
      />

      {/* ── Exhaust / jet wall emission port ── */}
      <rect
        x="-30"
        y="-2.5"
        width="2.5"
        height="5"
        rx={0.5}
        fill={color}
        fillOpacity={0.3}
      />
    </>
  );
}

// ─── Text Scramble ─────────────────────────────────────────────
function scrambleChars(
  elements: HTMLSpanElement[],
  text: string,
  duration: number
) {
  const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>{}";
  const start = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);

    elements.forEach((el, i) => {
      const cp = progress * (text.length + 2) - i;
      if (cp > 2) {
        el.textContent = text[i];
        el.style.opacity = "1";
        el.style.color = "";
      } else if (cp > 0) {
        el.textContent = pool[Math.floor(Math.random() * pool.length)];
        el.style.opacity = "1";
        el.style.color = "rgba(0, 212, 255, 0.35)";
      }
    });

    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

// ─── Component ─────────────────────────────────────────────────
export default function SplashScreen() {
  const cyanPathRef = useRef<SVGPathElement>(null);
  const orangePathRef = useRef<SVGPathElement>(null);
  const cyanBikeRef = useRef<SVGGElement>(null);
  const orangeBikeRef = useRef<SVGGElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const fragRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const cyanPath = cyanPathRef.current;
    const orangePath = orangePathRef.current;
    const cyanBike = cyanBikeRef.current;
    const orangeBike = orangeBikeRef.current;
    const flash = flashRef.current;
    if (!cyanPath || !orangePath || !cyanBike || !orangeBike || !flash) return;

    const cyanLen = cyanPath.getTotalLength();
    const orangeLen = orangePath.getTotalLength();

    // Initialize trails
    gsap.set(cyanPath, {
      strokeDasharray: cyanLen,
      strokeDashoffset: cyanLen,
    });
    gsap.set(orangePath, {
      strokeDasharray: orangeLen,
      strokeDashoffset: orangeLen,
    });
    gsap.set([cyanBike, orangeBike], { opacity: 0 });
    gsap.set(flash, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });

    const tl = gsap.timeline();

    // ── Cyan trail draws with light cycle (0.2s → 3.0s) ──
    const cyanProxy = { progress: 0 };
    tl.to(
      cyanProxy,
      {
        progress: 1,
        duration: 2.8,
        ease: "power1.inOut",
        onStart: () => gsap.set(cyanBike, { opacity: 1 }),
        onUpdate: () => {
          const drawn = cyanProxy.progress * cyanLen;
          gsap.set(cyanPath, { strokeDashoffset: cyanLen - drawn });
          cyanBike.setAttribute(
            "transform",
            getBikeTransform(cyanPath, drawn, cyanLen)
          );
        },
        onComplete: () => gsap.to(cyanBike, { opacity: 0, duration: 0.1 }),
      },
      0.2
    );

    // ── Orange trail draws with light cycle (0.2s → 3.0s) ──
    const orangeProxy = { progress: 0 };
    tl.to(
      orangeProxy,
      {
        progress: 1,
        duration: 2.8,
        ease: "power1.inOut",
        onStart: () => gsap.set(orangeBike, { opacity: 1 }),
        onUpdate: () => {
          const drawn = orangeProxy.progress * orangeLen;
          gsap.set(orangePath, { strokeDashoffset: orangeLen - drawn });
          orangeBike.setAttribute(
            "transform",
            getBikeTransform(orangePath, drawn, orangeLen)
          );
        },
        onComplete: () => gsap.to(orangeBike, { opacity: 0, duration: 0.1 }),
      },
      0.2
    );

    // ── Collision flash (3.0s) ──
    tl.to(
      flash,
      { scale: 1.5, opacity: 1, duration: 0.15, ease: "power2.out" },
      3.0
    );
    tl.to(
      flash,
      { scale: 5, opacity: 0, duration: 0.5, ease: "power2.out" },
      3.15
    );

    // ── Collision particles burst (3.0s) ──
    const particleEls = particlesRef.current?.children;
    if (particleEls && particleEls.length > 0) {
      tl.fromTo(
        Array.from(particleEls),
        { x: 0, y: 0, scale: 1, opacity: 1 },
        {
          x: (i: number) => collisionParticles[i].x,
          y: (i: number) => collisionParticles[i].y,
          scale: 0,
          opacity: 0,
          duration: 1.2,
          ease: "power2.out",
          stagger: { amount: 0.15 },
        },
        3.0
      );
    }

    // ── Trails dim after collision (3.2s) ──
    tl.to(
      [cyanPath, orangePath],
      {
        opacity: 0.12,
        duration: 1,
        ease: "power2.out",
      },
      3.2
    );

    // ── TRON text scramble (3.2s) ──
    tl.call(
      () => {
        const els = charRefs.current.filter(Boolean) as HTMLSpanElement[];
        if (els.length > 0) scrambleChars(els, "TRON", 1000);
      },
      [],
      3.2
    );

    // ── Subtitle (4.2s) ──
    const isMobile = window.innerWidth < 768;
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, letterSpacing: isMobile ? "0.9em" : "1.4em" },
      { opacity: 1, letterSpacing: isMobile ? "0.4em" : "0.6em", duration: 0.8, ease: "power2.out" },
      4.2
    );

    // ── Coordinated derezz exit ──
    // Wait for BOTH the animation timer AND hero content readiness.
    // Safety valve at 8s prevents users from getting stuck if signal never fires.
    let animDone = false;
    let heroLoaded = (window as any).__heroReady === true;
    let derezzed = false;

    const runDerezz = () => {
      if (derezzed || !animDone || !heroLoaded) return;
      derezzed = true;

      const content = contentRef.current;
      const frags = fragRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!content || frags.length === 0) {
        document.body.style.overflow = "";
        setRemoved(true);
        return;
      }

      gsap.to(content, { opacity: 0, duration: 0.12 });
      frags.forEach((f) => {
        f.style.opacity = "1";
      });

      gsap.to(frags, {
        x: () => (Math.random() - 0.5) * 800,
        y: () => (Math.random() - 0.5) * 800,
        rotation: () => (Math.random() - 0.5) * 200,
        scale: 0,
        opacity: 0,
        duration: 0.9,
        ease: "power2.in",
        stagger: { from: "center", amount: 0.25 },
        onComplete: () => {
          document.body.style.overflow = "";
          setRemoved(true);
        },
      });
    };

    // Animation timer — marks animation as done after SPLASH_DURATION
    const animTimerId = setTimeout(() => {
      animDone = true;
      runDerezz();
    }, SPLASH_DURATION);

    // Listen for hero-ready from FrameCanvas
    const onHeroReady = () => {
      heroLoaded = true;
      runDerezz();
    };
    window.addEventListener("hero-ready", onHeroReady);

    // If hero was already ready before listener attached (race condition)
    if ((window as any).__heroReady === true) {
      heroLoaded = true;
    }

    // Safety valve — force derezz at 8s max to prevent permanent splash
    const safetyTimerId = setTimeout(() => {
      animDone = true;
      heroLoaded = true;
      runDerezz();
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* ── Derezz fragment grid (hidden until exit) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {fragments.map((f, i) => (
          <div
            key={i}
            ref={(el) => {
              fragRefs.current[i] = el;
            }}
            style={{
              position: "absolute",
              left: `${(f.col / FRAG_COLS) * 100}%`,
              top: `${(f.row / FRAG_ROWS) * 100}%`,
              width: `${100 / FRAG_COLS}%`,
              height: `${100 / FRAG_ROWS}%`,
              background: "#050508",
              border: "0.5px solid rgba(0,212,255,0.12)",
              opacity: 0,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>

      {/* ── Main content layer ── */}
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Light Cycle Battle — SVG */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 3,
          }}
        >
          <defs>
            {/* Trail glow filters */}
            <filter id="glow-c">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b1" />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="18"
                result="b2"
              />
              <feMerge>
                <feMergeNode in="b2" />
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-o">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b1" />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="18"
                result="b2"
              />
              <feMerge>
                <feMergeNode in="b2" />
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Bike glow — subtler so details remain visible */}
            <filter id="glow-bike" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Cyan trail */}
          <path
            ref={cyanPathRef}
            d={PATH_CYAN}
            stroke="#00d4ff"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow-c)"
          />

          {/* Orange trail */}
          <path
            ref={orangePathRef}
            d={PATH_ORANGE}
            stroke="#ff6b00"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow-o)"
          />

          {/* ── Cyan Light Cycle ── */}
          <g ref={cyanBikeRef} opacity={0} filter="url(#glow-bike)">
            <LightCycleBike color="#00d4ff" />
          </g>

          {/* ── Orange Light Cycle ── */}
          <g ref={orangeBikeRef} opacity={0} filter="url(#glow-bike)">
            <LightCycleBike color="#ff6b00" />
          </g>
        </svg>

        {/* Collision flash */}
        <div
          ref={flashRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "min(350px, 80vw)",
            height: "min(350px, 80vw)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(0,212,255,0.5) 25%, rgba(255,107,0,0.35) 55%, transparent 70%)",
            zIndex: 4,
          }}
        />

        {/* Collision particles */}
        <div
          ref={particlesRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 4,
          }}
        >
          {collisionParticles.map((p, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: "50%",
                background: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* TRON text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: "clamp(0.15em, 2vw, 0.35em)",
            fontFamily: "var(--font-orbitron), system-ui, sans-serif",
            fontSize: "clamp(2rem, 6vw, 4.5rem)",
            fontWeight: 900,
            letterSpacing: "clamp(0.2em, 3vw, 0.5em)",
            color: "#00d4ff",
            textShadow:
              "0 0 10px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,212,255,0.2)",
            whiteSpace: "nowrap",
            zIndex: 5,
          }}
        >
          {"TRON".split("").map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                charRefs.current[i] = el;
              }}
              style={{
                display: "inline-block",
                opacity: 0,
                minWidth: "0.6em",
                textAlign: "center",
              }}
            >
              {"\u00A0"}
            </span>
          ))}
        </div>

        {/* Subtitle */}
        <div
          ref={subtitleRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, calc(-50% + clamp(35px, 8vh, 65px)))",
            fontFamily: "var(--font-orbitron), system-ui, sans-serif",
            fontSize: "clamp(0.55rem, 1.5vw, 0.85rem)",
            fontWeight: 400,
            letterSpacing: "0.6em",
            color: "rgba(0, 212, 255, 0.5)",
            whiteSpace: "nowrap",
            opacity: 0,
            zIndex: 5,
          }}
        >
          THE LEGACY
        </div>
      </div>
    </div>
  );
}
