import { en } from "./en";
import { ko } from "./ko";
import type { Locale, SiteContent } from "./types";

const contentByLocale: Record<Locale, SiteContent> = {
  en,
  ko,
};

export const defaultLocale: Locale = "ko";

export function getContent(locale: Locale = defaultLocale): SiteContent {
  return contentByLocale[locale] ?? en;
}

export type { Locale, SiteContent };
