import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ReturnVisitSection } from "@/components/sections/ReturnVisitSection";
import { PersonalRouteFinder } from "@/components/sections/PersonalRouteFinder";
import { PremiumToolsSection } from "@/components/sections/PremiumToolsSection";
import { HomeSearch } from "@/components/sections/HomeSearch";
import { HomeTrustBar } from "@/components/sections/HomeTrustBar";
import { ExperienceStoriesSection } from "@/components/sections/ExperienceStoriesSection";
import { HomeStartSection } from "@/components/sections/HomeStartSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeStartSection />
        <HomeSearch />
        <ToolsSection />
        <ReturnVisitSection />
        <PremiumToolsSection />
        <PersonalRouteFinder />
        <ExperienceStoriesSection />
        <ArticlesSection />
        <HomeTrustBar />
      </main>
      <Footer />
    </>
  );
}
