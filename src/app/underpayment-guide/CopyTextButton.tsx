"use client";

import { useState } from "react";

export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copyText} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
      {copied ? "복사했어요" : label}
    </button>
  );
}
