import { ImageResponse } from "next/og";

export function createSocialImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#f8f7f4", color: "#1a2744", padding: "68px 78px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", borderTop: "3px solid #1a2744", borderBottom: "3px solid #1a2744", padding: "38px 0 42px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, letterSpacing: 4, color: "#a27e1f" }}>AUSSIE COMPASS</div>
          <div style={{ width: 92, height: 92, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #c4a035", borderRadius: "50%" }}>
            <div style={{ width: 22, height: 54, display: "flex", background: "#1a2744", clipPath: "polygon(50% 0, 100% 100%, 50% 78%, 0 100%)", transform: "rotate(38deg)" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: 68, lineHeight: 1.04, fontWeight: 700, letterSpacing: -2 }}>AUSTRALIA LIFE</div>
          <div style={{ display: "flex", fontSize: 68, lineHeight: 1.04, fontWeight: 400, fontStyle: "italic", letterSpacing: -2 }}>TOOLS &amp; GUIDES.</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 25, color: "#5c6478" }}>Practical answers for work, money, housing and everyday life.</div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
