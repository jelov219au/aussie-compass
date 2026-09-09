import { HomeConversionAnalytics } from "@/components/analytics/HomeConversionAnalytics";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { ReturnVisitSection } from "@/components/sections/ReturnVisitSection";
import { PersonalRouteFinder } from "@/components/sections/PersonalRouteFinder";
import { PremiumToolsSection } from "@/components/sections/PremiumToolsSection";
import { HomeInstallBanner } from "@/components/sections/HomeInstallBanner";
import { HomeTrustBar } from "@/components/sections/HomeTrustBar";
import { HomeSocialChannels } from "@/components/sections/HomeSocialChannels";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="site-screen home-screen">
        <HomeConversionAnalytics />
        <Hero />
        <ToolsSection />
        <PersonalRouteFinder />
        <PremiumToolsSection />
        <ReturnVisitSection />
        <HomeInstallBanner />
        <ArticlesSection />
        <HomeSocialChannels />
        <HomeTrustBar />
      </main>
      <Footer />
    </>
  );
}
