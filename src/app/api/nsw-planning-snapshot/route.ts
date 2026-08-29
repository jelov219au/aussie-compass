import { createNswPlanningDataProvider } from "@/lib/nswPlanningDataProvider";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await createNswPlanningDataProvider().getSnapshot();
  return Response.json(snapshot, {
    status: snapshot.status === "unavailable" ? 503 : 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Hoju-Data-Mode": snapshot.status,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
