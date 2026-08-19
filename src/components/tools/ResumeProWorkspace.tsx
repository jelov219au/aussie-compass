"use client";

import { useEffect, useMemo, useState } from "react";

type Tone = "clear" | "warm" | "concise";
type SavedResume = {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  location?: string;
  link?: string;
  summary?: string;
  skills?: string;
  licences?: string;
  languages?: string;
  experiences?: Array<{ role?: string; company?: string; period?: string; details?: string }>;
  education?: Array<{ course?: string; school?: string; period?: string }>;
};
type ProDraft = {
  company: string;
  role: string;
  hiringManager: string;
  jobAd: string;
  tone: Tone;
  coverLetter: string;
};

const RESUME_STORAGE_KEY = "aussie-compass-resume-v1";
const PRO_STORAGE_KEY = "hoju-compass-resume-pro-preview-v1";
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";
const labelClass = "block text-sm font-medium text-navy";
const stopWords = new Set([
  "about", "after", "also", "and", "are", "been", "being", "but", "can", "company", "experience", "from", "have", "include", "includes", "into", "job", "more", "must", "our", "position", "preparing", "required", "requirements", "responsibilities", "role", "seeking", "that", "the", "their", "this", "through", "using", "will", "with", "work", "you", "your",
]);

function readSavedResume(): SavedResume {
  try {
    return JSON.parse(window.localStorage.getItem(RESUME_STORAGE_KEY) || "{}") as SavedResume;
  } catch {
    return {};
  }
}

function normaliseWords(value: string) {
  return value.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) ?? [];
}

function extractKeywords(value: string) {
  const counts = new Map<string, number>();
  normaliseWords(value).forEach((word) => {
    const cleaned = word.replace(/^[.-]+|[.-]+$/g, "");
    if (cleaned.length < 4 || stopWords.has(cleaned)) return;
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 14).map(([word]) => word);
}

function sentence(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "resume-application";
}

export function ResumeProWorkspace() {
  const [savedResume, setSavedResume] = useState<SavedResume>({});
  const [draft, setDraft] = useState<ProDraft>({ company: "", role: "", hiringManager: "", jobAd: "", tone: "clear", coverLetter: "" });
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSavedResume(readSavedResume());
    try {
      const stored = window.localStorage.getItem(PRO_STORAGE_KEY);
      if (stored) setDraft((current) => ({ ...current, ...JSON.parse(stored) }));
    } catch {
      // The preview remains usable when local storage is unavailable.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // The preview remains usable when local storage is unavailable.
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const resumeText = useMemo(() => JSON.stringify(savedResume).toLowerCase(), [savedResume]);
  const keywords = useMemo(() => extractKeywords(draft.jobAd), [draft.jobAd]);
  const matched = useMemo(() => keywords.filter((keyword) => resumeText.includes(keyword)), [keywords, resumeText]);
  const missing = useMemo(() => keywords.filter((keyword) => !resumeText.includes(keyword)), [keywords, resumeText]);
  const matchRate = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
  const hasResume = Boolean(savedResume.name || savedResume.summary || savedResume.experiences?.some((item) => item.role || item.details));

  const setField = <K extends keyof ProDraft>(field: K, value: ProDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));

  const refreshResume = () => {
    const next = readSavedResume();
    setSavedResume(next);
    setMessage(next.name || next.summary ? "무료 빌더의 최신 이력서를 불러왔습니다." : "저장된 이력서가 없습니다. 무료 빌더에서 먼저 작성해 주세요.");
  };

  const createCoverLetter = () => {
    const role = draft.role.trim() || savedResume.title?.trim() || "the advertised role";
    const company = draft.company.trim() || "your team";
    const manager = draft.hiringManager.trim() || "Hiring Manager";
    const name = savedResume.name?.trim() || "Your Name";
    const summary = sentence(savedResume.summary) || `I am applying for the ${role} position with a reliable, practical approach and a strong willingness to contribute.`;
    const firstExperience = savedResume.experiences?.find((item) => item.role || item.details);
    const achievement = sentence(firstExperience?.details?.split("\n").find(Boolean));
    const skills = savedResume.skills?.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3) ?? [];
    const skillLine = skills.length ? `My relevant strengths include ${skills.join(", ")}.` : "I learn new processes quickly and take ownership of the work assigned to me.";
    const missingLine = missing.length ? `I was particularly interested in your focus on ${missing.slice(0, 3).join(", ")}, and I would welcome the opportunity to discuss how my experience can support these priorities.` : `I would welcome the opportunity to discuss how my experience can support ${company}.`;
    const opening = draft.tone === "warm"
      ? `I was pleased to see the ${role} opportunity with ${company}.`
      : draft.tone === "concise"
        ? `I am writing to apply for the ${role} position at ${company}.`
        : `I am interested in the ${role} position at ${company} and believe my experience would allow me to contribute from the outset.`;
    const closing = draft.tone === "warm" ? "Thank you for taking the time to consider my application. I would be delighted to speak with you." : "Thank you for considering my application. I look forward to the opportunity to discuss my suitability for the role.";
    const paragraphs = [
      `Dear ${manager},`,
      `${opening} ${summary}`,
      [achievement, skillLine].filter(Boolean).join(" "),
      missingLine,
      closing,
      `Kind regards,\n${name}`,
    ];
    setField("coverLetter", paragraphs.join("\n\n"));
    setMessage("커버레터 초안을 만들었습니다. 사실과 표현을 직접 확인해 주세요.");
  };

  const copyCoverLetter = async () => {
    if (!draft.coverLetter) return;
    try {
      await navigator.clipboard.writeText(draft.coverLetter);
      setMessage("커버레터를 복사했습니다.");
    } catch {
      setMessage("복사하지 못했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  const downloadApplicationKit = () => {
    const contact = [savedResume.phone, savedResume.email, savedResume.location, savedResume.link].filter(Boolean).join(" · ");
    const experienceLines = savedResume.experiences?.filter((item) => item.role || item.company || item.details).flatMap((item) => [
      `- ${[item.role, item.company, item.period].filter(Boolean).join(" · ") || "Experience"}`,
      ...(item.details?.split("\n").map((line) => `  ${line.trim()}`).filter((line) => line.trim()) ?? []),
    ]) ?? [];
    const educationLines = savedResume.education?.filter((item) => item.course || item.school).map((item) => `- ${[item.course, item.school, item.period].filter(Boolean).join(" · ")}`) ?? [];
    const lines = [
      "HOJU COMPASS — RESUME PRO APPLICATION KIT",
      `Company: ${draft.company || "Not set"}`,
      `Role: ${draft.role || savedResume.title || "Not set"}`,
      `Hiring manager: ${draft.hiringManager || "Hiring Manager"}`,
      "",
      "SUBMISSION CHECK",
      `- Resume name: ${savedResume.name || "Check before submitting"}`,
      `- Job-ad expressions found in resume: ${matched.length ? matched.join(", ") : "None identified"}`,
      `- Expressions to verify against real experience: ${missing.length ? missing.join(", ") : "None identified"}`,
      "- Confirm the company name, role, contact details, dates and qualifications.",
      "- Add only skills and experience you genuinely have.",
      "",
      "RESUME SNAPSHOT",
      `${savedResume.name || "Name not set"}${savedResume.title ? ` — ${savedResume.title}` : ""}`,
      contact || "Contact details not set",
      "",
      "Professional summary",
      savedResume.summary || "Not set",
      "",
      "Skills",
      savedResume.skills || "Not set",
      "",
      "Licences and languages",
      [savedResume.licences, savedResume.languages].filter(Boolean).join(" · ") || "Not set",
      "",
      "Experience",
      ...(experienceLines.length ? experienceLines : ["- Not set"]),
      "",
      "Education",
      ...(educationLines.length ? educationLines : ["- Not set"]),
      "",
      "COVER LETTER",
      draft.coverLetter || "Not created",
      "",
      "This file is a personal preparation copy. Review every statement before submitting and store it securely because it may contain contact and employment details.",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(`${draft.company}-${draft.role || savedResume.title || "application"}`)}-application-kit.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("이력서 요약, 공고 점검과 커버레터를 지원서 패키지로 저장했습니다.");
  };

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(34rem,1.08fr)]">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="pro-input-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application brief</p><h2 id="pro-input-heading" className="mt-2 text-2xl font-semibold text-navy">지원할 회사와 공고</h2></div>
          <button type="button" onClick={refreshResume} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">이력서 다시 불러오기</button>
        </div>
        <div className={`mt-5 border-l-2 p-4 text-sm leading-6 ${hasResume ? "border-[#3f6d5c] bg-[#3f6d5c]/8 text-navy" : "border-gold bg-gold/8 text-muted"}`}>
          {hasResume ? <><strong className="block text-navy">{savedResume.name || "저장된 이력서"}의 내용을 연결했습니다.</strong>무료 이력서 빌더의 Summary, 경력과 Skills를 초안에 사용합니다.</> : <><strong className="block text-navy">저장된 이력서를 찾지 못했습니다.</strong>입력 없이도 사용할 수 있지만 무료 빌더를 먼저 작성하면 더 구체적인 초안이 만들어집니다.</>}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>회사명<input className={inputClass} value={draft.company} onChange={(event) => setField("company", event.target.value)} placeholder="Compass Cafe" /></label>
          <label className={labelClass}>지원 직무<input className={inputClass} value={draft.role} onChange={(event) => setField("role", event.target.value)} placeholder="Barista" /></label>
          <label className={`${labelClass} sm:col-span-2`}>담당자 이름 <span className="font-normal text-muted">(선택)</span><input className={inputClass} value={draft.hiringManager} onChange={(event) => setField("hiringManager", event.target.value)} placeholder="Hiring Manager" /></label>
        </div>
        <label className="mt-5 block text-sm font-medium text-navy">채용 공고<textarea className={`${inputClass} min-h-48 resize-y`} value={draft.jobAd} onChange={(event) => setField("jobAd", event.target.value)} placeholder="채용 공고의 Responsibilities, Requirements 부분을 붙여 넣으세요." /></label>
        <fieldset className="mt-5"><legend className="text-sm font-medium text-navy">문장 분위기</legend><div className="mt-2 grid grid-cols-3 gap-2">{([['clear','명확하게'],['warm','친근하게'],['concise','간결하게']] as const).map(([id,label]) => <button key={id} type="button" onClick={() => setField("tone", id)} aria-pressed={draft.tone === id} className={`min-h-11 border px-2 py-2 text-sm ${draft.tone === id ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`}>{label}</button>)}</div></fieldset>
        <button type="button" onClick={createCoverLetter} className="mt-6 min-h-12 bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">커버레터 초안 만들기</button>
        <p className="mt-4 min-h-6 text-sm leading-6 text-muted" aria-live="polite">{message}</p>
      </section>

      <div className="space-y-8 xl:sticky xl:top-24">
        <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="keyword-heading">
          <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Job match check</p><h2 id="keyword-heading" className="mt-2 text-xl font-semibold text-navy">공고 핵심 표현 점검</h2></div><p className="font-mono text-3xl text-navy">{keywords.length ? `${matchRate}%` : "—"}</p></div>
          {!draft.jobAd.trim() ? <p className="mt-5 border-t border-border pt-5 text-sm leading-6 text-muted">채용 공고를 붙여 넣으면 반복되는 핵심 표현을 이력서 내용과 비교합니다.</p> : <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2"><div><h3 className="text-sm font-semibold text-[#315f4e]">이력서에 있는 표현</h3><div className="mt-3 flex flex-wrap gap-2">{matched.length ? matched.map((item) => <span key={item} className="bg-[#315f4e]/10 px-2.5 py-1 text-xs text-[#315f4e]">{item}</span>) : <span className="text-sm text-muted">아직 일치하는 표현이 없습니다.</span>}</div></div><div><h3 className="text-sm font-semibold text-[#8a6825]">직접 확인할 표현</h3><div className="mt-3 flex flex-wrap gap-2">{missing.map((item) => <span key={item} className="bg-gold/12 px-2.5 py-1 text-xs text-[#755b20]">{item}</span>)}</div></div></div>}
          <p className="mt-5 text-xs leading-5 text-muted">이 수치는 ATS 합격 점수가 아닙니다. 실제로 보유한 경험과 자격만 이력서에 추가하세요.</p>
        </section>

        <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="cover-letter-heading">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Cover letter draft</p><h2 id="cover-letter-heading" className="mt-2 text-xl font-semibold text-navy">커버레터 초안</h2></div><button type="button" onClick={copyCoverLetter} disabled={!draft.coverLetter} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-35">텍스트 복사</button></div>
          <label className="sr-only" htmlFor="pro-cover-letter">커버레터 초안</label>
          <textarea id="pro-cover-letter" className={`${inputClass} mt-5 min-h-[32rem] resize-y font-serif leading-7`} value={draft.coverLetter} onChange={(event) => setField("coverLetter", event.target.value)} placeholder="왼쪽에서 지원 정보와 채용 공고를 입력한 뒤 초안을 만드세요." />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={downloadApplicationKit} disabled={!draft.coverLetter} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-35">지원서 패키지 저장</button>
            <span className="text-xs leading-5 text-muted">TXT 파일 · 이력서 요약, 공고 점검, 커버레터 포함</span>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">초안은 자동 저장되며 이 브라우저 밖으로 전송되지 않습니다. 최종 제출 전 회사명, 담당자, 경력과 자격을 직접 확인하세요.</p>
        </section>
      </div>
    </div>
  );
}
