import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ToolsSection } from "@/components/sections/ToolsSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { ArticlesSection } from "@/components/sections/ArticlesSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { EmailSection } from "@/components/sections/EmailSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ToolsSection />
        <HowItWorksSection />
        <ArticlesSection />
        <AboutSection />
        <EmailSection />
      </main>
      <Footer />
    </>
  );
}
