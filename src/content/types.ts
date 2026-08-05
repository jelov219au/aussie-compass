export type Locale = "en" | "ko";

export type SiteContent = {
  brand: {
    name: string;
    tagline: string;
  };
  nav: {
    tools: string;
    guides: string;
    about: string;
    exploreTools: string;
  };
  hero: {
    label: string;
    heading: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    trust: string;
  };
  tools: {
    heading: string;
    description: string;
  };
  howItWorks: {
    heading: string;
    steps: readonly { title: string; description: string }[];
  };
  articles: {
    heading: string;
    comingSoonLabel: string;
  };
  email: {
    heading: string;
    description: string;
    placeholder: string;
    button: string;
    successMessage: string;
    invalidMessage: string;
  };
  footer: {
    privacy: string;
    disclaimer: string;
    legalDisclaimer: string;
  };
};
