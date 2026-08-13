import { createAppIcon } from "@/lib/appIcon";

export const dynamic = "force-static";

export function GET() {
  return createAppIcon(192);
}
