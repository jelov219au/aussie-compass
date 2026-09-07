import { payEvidenceSample } from "@/lib/payEvidenceSample";
import { createPayEvidenceCsv } from "@/lib/payEvidenceOutput";

export function GET() {
  return new Response(createPayEvidenceCsv(payEvidenceSample), { headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="hoju-compass-pay-fictional-sample.csv"',
    "X-Content-Type-Options": "nosniff",
  } });
}
