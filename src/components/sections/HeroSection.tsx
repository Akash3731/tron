"use client";

import FrameCanvas from "@/components/canvas/FrameCanvas";

export default function HeroSection() {
  return (
    <FrameCanvas
      videoSrc="https://res.cloudinary.com/dkwlkmqrz/video/upload/v1788439397/intro.mp4"
      posterSrc="/video/intro-poster.jpg"
      scrollDistance="+=200%"
    />
  );
}
