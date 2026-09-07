import { payEvidenceSample } from "@/lib/payEvidenceSample";
import { createPayEvidenceSummary } from "@/lib/payEvidenceOutput";

export function GET() {
  return new Response(createPayEvidenceSummary(payEvidenceSample), { headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Disposition": 'attachment; filename="hoju-compass-pay-fictional-sample.txt"',
    "X-Content-Type-Options": "nosniff",
  } });
}
