import { ImageResponse } from "next/og";

export const alt = "Resume Pro 공고별 이력서, 커버레터와 STAR 면접 메모 작업 공간";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const deliverables = [
  ["01", "TAILORED RESUME", "Compare real experience with one job ad"],
  ["02", "COVER LETTER", "Reuse verified evidence for each company"],
  ["03", "STAR EVIDENCE", "Keep interview examples for the next role"],
] as const;

export default function ResumeProOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f0e7",
          color: "#1a2744",
          padding: "54px 64px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>HOJU COMPASS</div>
          <div style={{ display: "flex", border: "2px solid #b8902f", borderRadius: 999, padding: "9px 16px", fontSize: 16, fontWeight: 700 }}>
            ONE-OFF · BROWSER WORKSPACE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", color: "#8a6a1f", fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>RESUME PRO</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 12, fontSize: 48, lineHeight: 1.08, fontWeight: 800, letterSpacing: -1.5 }}>
            <div style={{ display: "flex" }}>ONE JOB AD. ONE APPLICATION KIT.</div>
            <div style={{ display: "flex", color: "#3f5872" }}>REUSABLE STAR EVIDENCE.</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {deliverables.map(([number, title, description]) => (
            <div key={number} style={{ display: "flex", flex: 1, flexDirection: "column", borderTop: "4px solid #b8902f", background: "#ffffff", padding: "18px 20px" }}>
              <div style={{ display: "flex", color: "#8a6a1f", fontSize: 16, fontWeight: 800 }}>{number}</div>
              <div style={{ display: "flex", marginTop: 6, fontSize: 23, fontWeight: 800 }}>{title}</div>
              <div style={{ display: "flex", marginTop: 7, color: "#5c6478", fontSize: 16, lineHeight: 1.35 }}>{description}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
