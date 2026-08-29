import type { ReactNode } from "react";

export type TopicIconName = "arrival" | "visa" | "home" | "work" | "money" | "document" | "guide" | "search";

export function TopicIcon({ name, size = "md", className = "" }: { name: TopicIconName; size?: "sm" | "md"; className?: string }) {
  const paths: Record<TopicIconName, ReactNode> = {
    arrival: <><path d="M4 18h16" /><path d="M7 18V9l5-4 5 4v9" /><path d="M10 18v-5h4v5" /></>,
    visa: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    home: <><path d="m3 11 9-7 9 7" /><path d="M5.5 10v10h13V10" /><path d="M9 20v-6h6v6" /></>,
    work: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" /></>,
    money: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5c-.8-.7-1.9-1-3-1-1.7 0-3 .9-3 2.2 0 3.3 6 1.7 6 5 0 1.3-1.3 2.3-3 2.3-1.3 0-2.7-.5-3.5-1.3M12 5.5v13" /></>,
    document: <><path d="M6 3.5h8l4 4V21H6z" /><path d="M14 3.5V8h4M9 12h6M9 16h6" /></>,
    guide: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23.5z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5a3.5 3.5 0 0 1 3.5 3.5z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  };

  const sizeClass = size === "sm" ? "h-10 w-10 rounded-xl [&_svg]:h-5 [&_svg]:w-5" : "h-12 w-12 rounded-2xl [&_svg]:h-6 [&_svg]:w-6";

  return <span className={`inline-flex shrink-0 items-center justify-center bg-navy text-gold shadow-[0_8px_18px_rgba(26,39,68,0.14)] ${sizeClass} ${className}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg></span>;
}
