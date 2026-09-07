export type ActionVariant = "primary" | "secondary" | "darkSecondary" | "tertiary";

const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const variants: Record<ActionVariant, string> = {
  primary: "border border-navy bg-navy text-white hover:bg-navy-light",
  secondary: "border border-navy bg-white text-navy hover:bg-surface",
  darkSecondary: "border border-white/70 bg-transparent text-white hover:border-white hover:bg-white hover:text-navy",
  tertiary: "min-h-11 rounded-none border-b-2 border-gold px-0 py-2 text-navy hover:border-navy",
};

export function actionClass(variant: ActionVariant = "primary", className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}
