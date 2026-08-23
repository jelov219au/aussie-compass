import { ImageResponse } from "next/og";

export const resumeJobAdCheckerSocialImageSize = { width: 1200, height: 630 };

const terms = [
  ["CUSTOMER SERVICE", "FOUND IN RESUME", true],
  ["INVENTORY MANAGEMENT", "CHECK REAL EVIDENCE", false],
  ["ATTENTION TO DETAIL", "CHECK REAL EVIDENCE", false],
] as const;

export function createResumeJobAdCheckerSocialImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#f8f7f4", color: "#1a2744", padding: "54px 64px" }}>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", borderTop: "3px solid #1a2744", borderBottom: "3px solid #1a2744", padding: "28px 0 30px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #c4a035", borderRadius: "50%", marginRight: 16 }}>
              <div style={{ width: 10, height: 25, display: "flex", background: "#1a2744", clipPath: "polygon(50% 0, 100% 100%, 50% 76%, 0 100%)", transform: "rotate(38deg)" }} />
            </div>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: 3.5 }}>HOJU COMPASS</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {['LOCAL ONLY', 'NO ATS SCORE', 'FREE CHECK'].map((label) => <div key={label} style={{ display: "flex", border: "1px solid #d8d4c8", background: "#ffffff", padding: "8px 12px", fontSize: 14, fontWeight: 700, letterSpacing: 1.2, color: "#5c6478" }}>{label}</div>)}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: 58, alignItems: "center", marginTop: 28 }}>
          <div style={{ width: 520, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 700, letterSpacing: 2.5, color: "#806515" }}>RESUME × JOB AD</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 18, fontSize: 55, lineHeight: 1.04, fontWeight: 700, letterSpacing: -1.8 }}>
              <div style={{ display: "flex" }}>MATCH THE WORDS.</div>
              <div style={{ display: "flex", color: "#3f5872" }}>VERIFY THE FACTS.</div>
            </div>
            <div style={{ display: "flex", marginTop: 22, maxWidth: 500, fontSize: 20, lineHeight: 1.45, color: "#5c6478" }}>
              Compare locally. Find what is already supported, then check real experience before adding anything.
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", border: "1px solid #d8d4c8", background: "#ffffff", padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #d8d4c8", paddingBottom: 14 }}>
              <div style={{ display: "flex", fontSize: 15, fontWeight: 700, letterSpacing: 1.7, color: "#5c6478" }}>EVIDENCE CHECK</div>
              <div style={{ display: "flex", fontSize: 15, color: "#806515" }}>3 NEXT QUESTIONS</div>
            </div>
            {terms.map(([term, status, matched]) => <div key={term} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #ece9e1", padding: "17px 0" }}>
              <div style={{ display: "flex", fontSize: 17, fontWeight: 700 }}>{term}</div>
              <div style={{ display: "flex", borderLeft: `3px solid ${matched ? "#2f7a59" : "#c4a035"}`, background: matched ? "#edf6f1" : "#f8f7f4", padding: "8px 10px", fontSize: 12, fontWeight: 700, color: matched ? "#245b44" : "#6b571e" }}>{status}</div>
            </div>)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 16, color: "#5c6478" }}>
          <div style={{ display: "flex" }}>No login · No upload · No invented experience</div>
          <div style={{ display: "flex", fontWeight: 700, color: "#1a2744" }}>hojucompass.com/resume-job-ad-checker</div>
        </div>
      </div>
    </div>,
    resumeJobAdCheckerSocialImageSize,
  );
}
