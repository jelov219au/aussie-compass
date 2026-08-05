type ToolIconProps = {
  className?: string;
};

export function ToolIcon({ className = "h-6 w-6" }: ToolIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 8h10M7 12h6M7 16h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GuideIcon({ className = "h-6 w-6" }: ToolIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 4h9l3 3v13H6V4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M15 4v3h3M9 11h6M9 15h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StepIcon({ step, className = "h-6 w-6" }: ToolIconProps & { step: number }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-navy ${className}`}
      aria-hidden="true"
    >
      {step}
    </span>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: ToolIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10.2l2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
