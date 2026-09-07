import { leavingSampleDraft } from "@/lib/leavingAustraliaSample";
import { createLeavingSummary } from "@/lib/leavingAustraliaSummary";

export function GET() {
  return new Response(createLeavingSummary(leavingSampleDraft), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hoju-compass-leaving-fictional-sample.txt"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}
