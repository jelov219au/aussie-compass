import { createRentalSummary } from "@/lib/rentalApplicationOutput";
import { rentalApplicationSample } from "@/lib/rentalApplicationSample";

export function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("candidate") ?? "home-a";
  const active = rentalApplicationSample.applications.find((item) => item.id === id);
  if (!active) return new Response("Unknown fictional candidate", { status: 404 });
  return new Response(createRentalSummary(rentalApplicationSample, active), { headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Disposition": `attachment; filename="hoju-compass-rental-${active.id}-fictional.txt"`,
    "X-Content-Type-Options": "nosniff",
  } });
}
