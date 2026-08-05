import { en } from "./en";
import type { Locale, SiteContent } from "./types";

const contentByLocale: Record<Locale, SiteContent> = {
  en,
  // Korean content can be added here later, e.g. ko: { ... }
  ko: en,
};

export const defaultLocale: Locale = "en";

export function getContent(locale: Locale = defaultLocale): SiteContent {
  return contentByLocale[locale] ?? en;
}

export type { Locale, SiteContent };
