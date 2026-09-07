import { createRentalPropertyPackage } from "@/lib/rentalApplicationOutput";
import { rentalApplicationSample } from "@/lib/rentalApplicationSample";

export function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("candidate") ?? "home-a";
  const active = rentalApplicationSample.applications.find((item) => item.id === id);
  if (!active) return new Response("Unknown fictional candidate", { status: 404 });
  return new Response(JSON.stringify(createRentalPropertyPackage(rentalApplicationSample, active, "2026-09-07T00:00:00.000Z"), null, 2), { headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Disposition": `attachment; filename="hoju-compass-rental-${active.id}-fictional-package.json"`,
    "X-Content-Type-Options": "nosniff",
  } });
}
