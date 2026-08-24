import Link from "next/link";

import type { ResumeProCheckoutFailure } from "@/lib/resumeProCheckoutFailure";

export function ResumeProCheckoutFailureNotice({
  failure,
  id,
  className = "mt-4",
}: {
  failure: ResumeProCheckoutFailure;
  id: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={`${className} border-l-2 border-amber-600 bg-white px-4 py-3 text-sm leading-6 text-navy`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={-1}
    >
      <p>{failure.message}</p>
      {failure.retryable && (
        <p className="mt-1 text-xs leading-5 text-muted">이 페이지에서 다시 눌러도 중복 청구되지 않습니다.</p>
      )}
      {failure.action && (
        <Link
          href={failure.action.href}
          className="mt-3 inline-flex min-h-11 max-w-full items-center font-semibold text-navy underline decoration-gold underline-offset-4"
        >
          {failure.action.label}
        </Link>
      )}
    </div>
  );
}
