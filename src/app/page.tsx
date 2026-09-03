import HeroSection from "@/components/sections/HeroSection";

export default function Home() {
  return (
    <>
      <HeroSection />

      {/* Placeholder — more sections coming as content is added */}
      <section className="flex min-h-screen flex-col items-center justify-center">
        <p className="font-mono text-sm tracking-[0.3em] uppercase text-primary-dim">
          More sections coming soon
        </p>
      </section>
    </>
  );
}
