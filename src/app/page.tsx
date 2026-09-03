import HeroSection from "@/components/sections/HeroSection";

export default function Home() {
  return (
    <>
      <HeroSection />

      {/* Placeholder — more sections coming as content is added */}
      <section className="flex min-h-[60vh] md:min-h-screen flex-col items-center justify-center px-5 md:px-16">
        <p className="font-mono text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase text-primary-dim text-center">
          More sections coming soon
        </p>
      </section>
    </>
  );
}
