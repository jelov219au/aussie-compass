import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { EmailSection } from "@/components/sections/EmailSection";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { JourneySection } from "@/components/sections/JourneySection";
import { ReturnVisitSection } from "@/components/sections/ReturnVisitSection";
import { PersonalRouteFinder } from "@/components/sections/PersonalRouteFinder";
import { PremiumToolsSection } from "@/components/sections/PremiumToolsSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ReturnVisitSection />
        <PersonalRouteFinder />
        <JourneySection />
        <ToolsSection />
        <PremiumToolsSection />
        <ArticlesSection />
        <HowItWorksSection />
        <AboutSection />
        <EmailSection />
      </main>
      <Footer />
    </>
  );
}
