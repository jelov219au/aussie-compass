import { ImageResponse } from "next/og";
import { getArticle } from "@/data/articles";

export const alt = "Hoju Compass 호주 생활·취업 실용 가이드";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ArticleOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  const title = article?.socialTitle ?? "Practical guide to life in Australia";
  const readingMinutes = article?.readingTime.replace(/\D/g, "") ?? "5";
  const titleSize = title.length > 33 ? 54 : title.length > 24 ? 62 : 70;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#f8f7f4",
        color: "#1a2744",
        padding: "58px 70px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderTop: "3px solid #1a2744",
          borderBottom: "3px solid #1a2744",
          padding: "30px 0 34px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 46,
                height: 46,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #c4a035",
                borderRadius: "50%",
                marginRight: 18,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 25,
                  display: "flex",
                  background: "#1a2744",
                  clipPath: "polygon(50% 0, 100% 100%, 50% 76%, 0 100%)",
                  transform: "rotate(38deg)",
                }}
              />
            </div>
            <div style={{ display: "flex", fontSize: 23, fontWeight: 700, letterSpacing: 3.5 }}>
              HOJU COMPASS
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 19, color: "#5c6478" }}>hojucompass.com</div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "stretch", marginTop: 38 }}>
          <div style={{ width: 10, display: "flex", background: "#c4a035", marginRight: 34 }} />
          <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, letterSpacing: 2.5, color: "#a27e1f" }}>
              PRACTICAL GUIDE / {readingMinutes} MIN READ
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 900,
                marginTop: 22,
                fontSize: titleSize,
                lineHeight: 1.18,
                fontWeight: 700,
                letterSpacing: -2.5,
                wordBreak: "keep-all",
              }}
            >
              {title}
            </div>
          </div>
          <div style={{ width: 118, display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", fontSize: 16, letterSpacing: 2, color: "#5c6478" }}>FIELD NOTE</div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 42, fontWeight: 400, color: "#c4a035" }}>+</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
