"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface FrameCanvasProps {
  videoSrc: string;
  posterSrc?: string;
  scrollDistance?: string;
  children?: React.ReactNode;
}

export default function FrameCanvas({
  videoSrc,
  posterSrc,
  scrollDistance = "+=200%",
  children,
}: FrameCanvasProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const seekingRef = useRef(false);
  const pendingTimeRef = useRef<number | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  // Draw the current video frame onto the canvas.
  // Self-heals canvas dimensions on every call — if onReady was missed
  // or fired before videoWidth was populated, this corrects it.
  const heroSignalledRef = useRef(false);

  const signalHeroReady = useCallback(() => {
    if (heroSignalledRef.current) return;
    heroSignalledRef.current = true;
    (window as any).__heroReady = true;
    window.dispatchEvent(new CustomEvent("hero-ready"));
  }, []);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    // Ensure canvas internal resolution always matches video
    if (
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      (canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight)
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCanvasReady(true);
    signalHeroReady();
  }, [signalHeroReady]);

  // Debounced seek — prevents overwhelming the decoder with queued seeks.
  // Only the latest requested time is kept; intermediate values are dropped.
  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      if (seekingRef.current) {
        pendingTimeRef.current = time;
        return;
      }

      seekingRef.current = true;
      video.currentTime = time;
    },
    []
  );

  // Wire up video events: draw on seeked, resolve pending seeks, set canvas size
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setCanvasReady(false);

    const onSeeked = () => {
      drawFrame();
      seekingRef.current = false;

      if (pendingTimeRef.current !== null) {
        const next = pendingTimeRef.current;
        pendingTimeRef.current = null;
        seekTo(next);
      }
    };

    const onReady = () => {
      drawFrame();
    };

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);

    // If already loaded (cached), fire immediately
    if (video.readyState >= 2) onReady();

    // Fallback poller — catches every race condition where events fire
    // before listeners are attached (rapid refresh, cached video, etc).
    // Runs at ~60fps for fastest possible first-frame detection.
    // Cleans itself up the moment the first frame is drawn.
    const pollId = setInterval(() => {
      if (video.readyState >= 2) {
        onReady();
        clearInterval(pollId);
      }
    }, 16);

    return () => {
      clearInterval(pollId);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, [videoSrc, drawFrame, seekTo]);

  // ScrollTrigger — maps scroll progress to video time via the debounced seeker
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const video = videoRef.current;
        if (!video) return;

        const setup = () => {
          const duration = video.duration;
          if (!duration || !isFinite(duration)) return;

          ScrollTrigger.create({
            trigger: sectionRef.current,
            start: "top top",
            end: scrollDistance,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              seekTo(self.progress * duration);
            },
          });

          // Pin spacer insertion shifts DOM below, so force all
          // subsequent triggers to recalculate their positions.
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        };

        if (video.readyState >= 1) {
          setup();
        } else {
          video.addEventListener("loadedmetadata", setup, { once: true });
        }
      });
    },
    { scope: sectionRef, dependencies: [videoSrc, scrollDistance, seekTo] }
  );

  return (
    <div
      ref={sectionRef}
      className="relative w-full overflow-hidden h-[60vh] md:h-screen"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        className="absolute invisible pointer-events-none"
        aria-hidden
      />

      {/* Poster — shows instantly on cold load while video decodes */}
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          aria-hidden
          onLoad={signalHeroReady}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: canvasReady ? 1 : 0 }}
      />

      {/* Bottom gradient — fades into next section */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      {children}
    </div>
  );
}
