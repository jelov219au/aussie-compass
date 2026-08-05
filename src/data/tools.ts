export type ToolStatus = "available" | "availableSoon" | "comingSoon";

export type Tool = {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  featured?: boolean;
};

export const tools: Tool[] = [
  {
    id: "pay-calculator",
    name: "Pay Calculator",
    description: "Estimate weekly, monthly and annual pay.",
    status: "available",
    featured: true,
  },
  {
    id: "tax-calculator",
    name: "Tax Calculator",
    description: "Estimate Australian income tax and take-home pay.",
    status: "comingSoon",
  },
  {
    id: "super-calculator",
    name: "Super Calculator",
    description: "Estimate employer superannuation contributions.",
    status: "comingSoon",
  },
  {
    id: "minimum-wage-guide",
    name: "Minimum Wage Guide",
    description: "Understand minimum pay rates and casual loading.",
    status: "comingSoon",
  },
  {
    id: "cost-of-living-calculator",
    name: "Cost of Living Calculator",
    description: "Plan a realistic Australian living budget.",
    status: "comingSoon",
  },
  {
    id: "resume-builder",
    name: "Resume Builder",
    description: "Prepare a practical Australian-style resume.",
    status: "comingSoon",
  },
];

export const toolStatusLabels: Record<ToolStatus, string> = {
  available: "Available",
  availableSoon: "Available soon",
  comingSoon: "Coming soon",
};
