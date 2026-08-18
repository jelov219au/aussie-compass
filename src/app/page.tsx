import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ReturnVisitSection } from "@/components/sections/ReturnVisitSection";
import { PersonalRouteFinder } from "@/components/sections/PersonalRouteFinder";
import { PremiumToolsSection } from "@/components/sections/PremiumToolsSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ToolsSection />
        <ReturnVisitSection />
        <PersonalRouteFinder />
        <ArticlesSection />
        <PremiumToolsSection />
      </main>
      <Footer />
    </>
  );
}
