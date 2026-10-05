import "@/components/modern-landing/modern.css";
import Navbar from "@/components/modern-landing/Navbar";
import Hero from "@/components/modern-landing/Hero";
import PixelDivider from "@/components/modern-landing/PixelDivider";
import Logos from "@/components/modern-landing/Logos";
import Features from "@/components/modern-landing/Features";
import HowItWorks from "@/components/modern-landing/HowItWorks";
import Stats from "@/components/modern-landing/Stats";
import Testimonials from "@/components/modern-landing/Testimonials";
import Bento from "@/components/modern-landing/Bento";
import Comparison from "@/components/modern-landing/Comparison";
import Showcase from "@/components/modern-landing/Showcase";
import FAQ from "@/components/modern-landing/FAQ";
import Pricing from "@/components/modern-landing/Pricing";
import FinalCTA from "@/components/modern-landing/FinalCTA";
import Footer from "@/components/modern-landing/Footer";

export function Landing() {
  return (
    <main className="modern-landing flex flex-col w-full bg-[#0A0A0A] pt-[60px]">
      <Navbar />
      <Hero />
      <PixelDivider />
      <Logos />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Bento />
      <Comparison />
      <Showcase />
      <FAQ />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
