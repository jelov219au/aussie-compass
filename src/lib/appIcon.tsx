import { ImageResponse } from "next/og";

export function createAppIcon(size: number) {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a2744" }}>
      <div style={{ width: "70%", height: "70%", display: "flex", alignItems: "center", justifyContent: "center", border: `${Math.max(5, Math.round(size * 0.018))}px solid #c79a45`, borderRadius: "50%" }}>
        <div style={{ width: "20%", height: "48%", display: "flex", background: "#f8f7f4", clipPath: "polygon(50% 0, 100% 100%, 50% 78%, 0 100%)", transform: "rotate(38deg)" }} />
      </div>
    </div>,
    { width: size, height: size },
  );
}
