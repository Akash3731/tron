"use client";

import FrameCanvas from "@/components/canvas/FrameCanvas";

export default function HeroSection() {
  return (
    <FrameCanvas
      videoSrc="/video/intro.mp4"
      posterSrc="/video/intro-poster.jpg"
      scrollDistance="+=200%"
    />
  );
}
