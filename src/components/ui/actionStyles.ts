export type ActionVariant = "primary" | "secondary" | "darkSecondary" | "tertiary";

const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const variants: Record<ActionVariant, string> = {
  primary: "border-2 border-navy bg-navy text-white shadow-[0_8px_20px_rgba(26,39,68,0.16)] hover:-translate-y-0.5 hover:bg-navy-light hover:shadow-[0_12px_26px_rgba(26,39,68,0.2)]",
  secondary: "border-2 border-navy bg-white text-navy hover:-translate-y-0.5 hover:bg-surface",
  darkSecondary: "border-2 border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-navy",
  tertiary: "min-h-11 rounded-none border-b-2 border-gold px-0 py-2 text-navy hover:border-navy",
};

export function actionClass(variant: ActionVariant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}
