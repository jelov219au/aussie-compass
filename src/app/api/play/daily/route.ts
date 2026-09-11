import { dailyPlaySets } from "@/data/dailyPlay";
import { dailyQuizzes } from "@/data/playground";
import { publishedDailyPlay, validPlayDate, validateDailyPlayCatalog } from "@/lib/dailyPlay";

export const dynamic = "force-dynamic";
validateDailyPlayCatalog(dailyPlaySets, dailyQuizzes.map(item => `slang:${item.id}`));
const headers = { "Cache-Control": "private, no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" };
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  if (params.getAll("date").length > 1 || date !== null && !validPlayDate(date)) return Response.json({ error: "날짜를 확인해 주세요." }, { status: 400, headers });
  return Response.json(publishedDailyPlay(dailyPlaySets, new Date(), date), { headers });
}
