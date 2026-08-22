"use client";

type Props = {
  sessionId: string;
};

export function ResumeProActivationForm({ sessionId }: Props) {
  return (
    <form
      action="/api/resume-pro/access/activate"
      method="post"
      onSubmit={() => window.history.replaceState(null, "", "/resume-pro/success")}
    >
      <input type="hidden" name="session_id" value={sessionId} />
      <button type="submit" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy">
        Resume Pro 열기
      </button>
    </form>
  );
}
