import { createSocialImage } from "@/lib/socialImage";

export const alt = "Hoju Compass Australia life tools and guides";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return createSocialImage();
}
