"use client";

import type { ReactNode } from "react";

const checkoutHeadingId = "resume-pro-checkout-heading";

export function ResumeProCheckoutJumpLink({ children, className }: { children: ReactNode; className: string }) {
  const focusCheckoutHeading = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(checkoutHeadingId)?.focus({ preventScroll: true });
      });
    });
  };

  return (
    <a href="#resume-pro-checkout" className={className} onClick={focusCheckoutHeading}>
      {children}
    </a>
  );
}
