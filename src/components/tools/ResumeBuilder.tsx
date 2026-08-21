"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { TrackedLink } from "@/components/analytics/TrackedLink";

type Experience = { id: string; role: string; company: string; period: string; details: string };
type Education = { id: string; course: string; school: string; period: string };
type Accent = "navy" | "forest" | "burgundy" | "charcoal";
type LayoutStyle = "classic" | "compact";
type ResumeData = {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  link: string;
  summary: string;
  skills: string;
  licences: string;
  languages: string;
  showReferences: boolean;
  accent: Accent;
  layoutStyle: LayoutStyle;
  experiences: Experience[];
  education: Education[];
};

const STORAGE_KEY = "aussie-compass-resume-v1";
const emptyResume: ResumeData = {
  name: "",
  title: "",
  phone: "",
  email: "",
  location: "",
  link: "",
  summary: "",
  skills: "",
  licences: "",
  languages: "",
  showReferences: false,
  accent: "navy",
  layoutStyle: "classic",
  experiences: [{ id: "experience-1", role: "", company: "", period: "", details: "" }],
  education: [{ id: "education-1", course: "", school: "", period: "" }],
};

const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";
const labelClass = "block text-sm font-medium text-navy";
const accentOptions: Array<{ id: Accent; name: string; colour: string; secondary: string }> = [
  { id: "navy", name: "네이비", colour: "#1a2744", secondary: "#8a7126" },
  { id: "forest", name: "포레스트", colour: "#245143", secondary: "#8b6b27" },
  { id: "burgundy", name: "버건디", colour: "#702f3b", secondary: "#8a6825" },
  { id: "charcoal", name: "차콜", colour: "#30343b", secondary: "#5f6875" },
];
const writingExamples = [
  { ko: "바쁜 환경에서도 친절하고 정확하게 고객을 응대합니다.", en: "Deliver friendly and accurate customer service in fast-paced environments.", target: "experience" as const },
  { ko: "팀원들과 원활하게 소통하며 맡은 업무를 책임감 있게 수행합니다.", en: "Communicate effectively with team members and take ownership of assigned tasks.", target: "summary" as const },
  { ko: "신입 직원 교육과 업무 적응을 지원했습니다.", en: "Trained and supported new team members during onboarding.", target: "experience" as const },
  { ko: "새로운 업무를 빠르게 배우고 변화에 유연하게 대응합니다.", en: "Learn new processes quickly and adapt confidently to changing priorities.", target: "summary" as const },
  { ko: "고객 요청을 신속하게 해결해 긍정적인 경험을 만들었습니다.", en: "Resolved customer requests promptly to create a positive customer experience.", target: "experience" as const },
];

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ResumeBuilder({ resumeProLive }: { resumeProLive: boolean }) {
  const [resume, setResume] = useState<ResumeData>(emptyResume);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [koreanDraft, setKoreanDraft] = useState("");
  const [englishSuggestion, setEnglishSuggestion] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const completionTrackedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setResume({ ...emptyResume, ...JSON.parse(stored) });
    } catch {
      // A corrupt or unavailable local store should not stop the builder.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1600);
      } catch {
        // The resume remains usable when browser storage is unavailable.
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [loaded, resume]);

  const skills = useMemo(() => resume.skills.split(",").map((skill) => skill.trim()).filter(Boolean), [resume.skills]);
  const licences = useMemo(() => resume.licences.split("\n").map((item) => item.trim()).filter(Boolean), [resume.licences]);
  const languages = useMemo(() => resume.languages.split(",").map((item) => item.trim()).filter(Boolean), [resume.languages]);
  const activeAccent = accentOptions.find((option) => option.id === resume.accent) ?? accentOptions[0];
  const completedEssentials = [resume.name, resume.title, resume.phone, resume.email, resume.summary, resume.experiences[0]?.role, resume.skills].filter(Boolean).length;
  const resumeReady = completedEssentials === 7;
  const setField = (field: keyof Omit<ResumeData, "experiences" | "education">, value: string) =>
    setResume((current) => ({ ...current, [field]: value }));

  const updateExperience = (id: string, field: keyof Omit<Experience, "id">, value: string) =>
    setResume((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  const updateEducation = (id: string, field: keyof Omit<Education, "id">, value: string) =>
    setResume((current) => ({ ...current, education: current.education.map((item) => item.id === id ? { ...item, [field]: value } : item) }));

  const clearResume = () => {
    if (!window.confirm("작성한 내용을 모두 지울까요? 이 작업은 되돌릴 수 없습니다.")) return;
    setResume({ ...emptyResume, experiences: [{ ...emptyResume.experiences[0] }], education: [{ ...emptyResume.education[0] }] });
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const loadExample = () => {
    if (!window.confirm("현재 작성 내용을 예시로 바꿀까요?")) return;
    setResume({
      name: "Jiwon Kim", title: "Barista", phone: "0412 345 678", email: "jiwon.kim@email.com", location: "Sydney, NSW", link: "linkedin.com/in/jiwon-kim",
      summary: "Friendly and reliable barista with two years of experience in busy cafes. Skilled in espresso preparation, customer service and maintaining a clean, efficient workspace.",
      skills: "Espresso preparation, Customer service, POS, Teamwork", licences: "NSW Responsible Service of Alcohol (RSA)\nFood Safety Certificate", languages: "Korean (Native), English (Professional)", showReferences: true, accent: resume.accent, layoutStyle: resume.layoutStyle,
      experiences: [{ id: makeId("experience"), role: "Barista", company: "Compass Cafe", period: "Mar 2024 – Present", details: "Prepare up to 150 coffee orders per shift while maintaining quality\nTrain new team members in POS and closing procedures\nBuild positive relationships with regular customers" }],
      education: [{ id: makeId("education"), course: "Certificate III in Hospitality", school: "TAFE NSW", period: "2023 – 2024" }],
    });
  };

  const plainTextResume = useMemo(() => {
    const lines = [resume.name, resume.title, [resume.phone, resume.email, resume.location, resume.link].filter(Boolean).join(" | ")];
    if (resume.summary) lines.push("", "PROFESSIONAL SUMMARY", resume.summary);
    lines.push("", "EXPERIENCE");
    resume.experiences.forEach((item) => {
      lines.push([item.role, item.company].filter(Boolean).join(" — "), item.period);
      item.details.split("\n").filter(Boolean).forEach((detail) => lines.push(`• ${detail}`));
    });
    lines.push("", "EDUCATION & TRAINING");
    resume.education.forEach((item) => lines.push([item.course, item.school].filter(Boolean).join(" — "), item.period));
    if (skills.length) lines.push("", "SKILLS", skills.join(", "));
    if (licences.length) lines.push("", "LICENCES & CERTIFICATIONS", ...licences);
    if (languages.length) lines.push("", "LANGUAGES", languages.join(", "));
    if (resume.showReferences) lines.push("", "REFERENCES", "Available upon request");
    return lines.filter((line, index) => line || lines[index - 1]).join("\n").trim();
  }, [resume, skills, licences, languages]);

  const copyTextResume = async () => {
    try {
      await navigator.clipboard.writeText(plainTextResume);
      setActionMessage("텍스트 이력서를 복사했습니다.");
    } catch {
      setActionMessage("복사하지 못했습니다. 브라우저 권한을 확인해 주세요.");
    }
  };

  const exportDraft = () => {
    const file = new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${resume.name.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "resume"}-draft.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setActionMessage("작성본 백업을 저장했습니다.");
  };

  const importDraft = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<ResumeData>;
      if (typeof parsed.name !== "string" || !Array.isArray(parsed.experiences) || !Array.isArray(parsed.education)) throw new Error("invalid");
      if (!window.confirm("현재 작성 내용을 선택한 백업으로 바꿀까요?")) return;
      setResume({ ...emptyResume, ...parsed } as ResumeData);
      setActionMessage("작성본 백업을 불러왔습니다.");
    } catch {
      setActionMessage("Hoju Compass 이력서 백업 파일을 확인해 주세요.");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const createEnglishSuggestion = () => {
    const text = koreanDraft.trim();
    if (!text) return;
    const years = text.match(/(\d+)\s*년/)?.[1];
    const roleMap = [
      ["바리스타", "barista"], ["카페", "hospitality professional"], ["주방", "kitchen team member"], ["요리", "cook"],
      ["판매", "retail team member"], ["고객", "customer service professional"], ["청소", "cleaner"], ["개발", "software developer"],
      ["회계", "accounting professional"], ["간호", "nursing professional"], ["사무", "administration professional"],
    ] as const;
    const role = roleMap.find(([keyword]) => text.includes(keyword))?.[1] ?? "motivated professional";
    const strengths = [
      text.includes("친절") && "friendly customer service",
      (text.includes("책임") || text.includes("성실")) && "a reliable and responsible approach",
      text.includes("팀") && "strong teamwork",
      (text.includes("소통") || text.includes("의사소통")) && "clear communication",
      (text.includes("빠르") || text.includes("신속")) && "the ability to work efficiently in fast-paced environments",
      (text.includes("꼼꼼") || text.includes("정확")) && "strong attention to detail",
    ].filter(Boolean);
    const experience = years ? ` with ${years} years of experience` : "";
    const strengthText = strengths.length ? ` Skilled in ${strengths.slice(0, 3).join(", ")}.` : " Quick to learn, dependable and ready to contribute to a supportive team.";
    setEnglishSuggestion(`${role.charAt(0).toUpperCase()}${role.slice(1)}${experience}.${strengthText}`);
  };

  const insertWriting = (text: string, target: "summary" | "experience") => {
    if (target === "summary") setField("summary", [resume.summary, text].filter(Boolean).join(" "));
    else {
      const first = resume.experiences[0];
      if (first) updateExperience(first.id, "details", [first.details, text].filter(Boolean).join("\n"));
    }
    setActionMessage(target === "summary" ? "Professional summary에 추가했습니다." : "첫 번째 경력의 주요 성과에 추가했습니다.");
  };

  useEffect(() => {
    if (!resumeReady || completionTrackedRef.current) return;
    completionTrackedRef.current = true;
    track("Resume Builder Completed", { product: "resume_builder", essentials: 7 });
  }, [resumeReady]);

  const saveAsPdf = (entry: "completion_choice" | "builder_actions") => {
    track("Resume Export Started", { format: "pdf", entry });
    window.print();
  };

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(620px,1.1fr)]">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="resume-form-heading">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="resume-form-heading" className="text-xl font-semibold text-navy">이력서 내용</h2><p className="mt-1 text-sm leading-6 text-muted">영문으로 작성하면 오른쪽에 바로 반영됩니다.</p></div>
          <span className="min-w-16 text-right text-xs text-muted" aria-live="polite">{saved ? "저장됨" : "자동 저장"}</span>
        </div>
        <div className="mt-5 rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium text-navy">필수 내용 {completedEssentials}/7</span><button type="button" onClick={loadExample} className="min-h-11 font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">예시 불러오기</button></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="이력서 필수 내용 완성도" aria-valuemin={0} aria-valuemax={7} aria-valuenow={completedEssentials}><div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${(completedEssentials / 7) * 100}%` }} /></div>
        </div>

        <fieldset className="mt-7 rounded-xl border border-border p-4">
          <legend className="px-1 text-base font-semibold text-navy">디자인</legend>
          <div className="mt-2"><span className="text-sm font-medium text-navy">포인트 색상</span><div className="mt-2 flex flex-wrap gap-2">{accentOptions.map((option) => <button key={option.id} type="button" onClick={() => setResume((current) => ({ ...current, accent: option.id }))} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${resume.accent === option.id ? "border-navy bg-surface font-semibold" : "border-border"}`} aria-pressed={resume.accent === option.id}><span className="h-4 w-4 rounded-full" style={{ backgroundColor: option.colour }} aria-hidden="true" />{option.name}</button>)}</div></div>
          <div className="mt-4"><span className="text-sm font-medium text-navy">레이아웃</span><div className="mt-2 grid grid-cols-2 gap-2">{([['classic', '기본형', '여유 있는 간격'], ['compact', '간결형', '내용이 많을 때']] as const).map(([id, name, description]) => <button key={id} type="button" onClick={() => setResume((current) => ({ ...current, layoutStyle: id }))} className={`min-h-16 rounded-lg border p-3 text-left ${resume.layoutStyle === id ? "border-navy bg-surface" : "border-border"}`} aria-pressed={resume.layoutStyle === id}><strong className="block text-sm text-navy">{name}</strong><span className="mt-1 block text-xs text-muted">{description}</span></button>)}</div></div>
        </fieldset>

        <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/5 p-5" aria-labelledby="writing-helper-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">영문 작성 도우미</p>
          <h2 id="writing-helper-heading" className="mt-2 text-lg font-semibold text-navy">한국어 강점을 영문 초안으로</h2>
          <p className="mt-2 text-sm leading-6 text-muted">직무, 경력 연수, 강점 키워드를 한국어로 적으면 이력서용 영문 초안을 만듭니다. 내용은 외부로 전송되지 않습니다.</p>
          <label className="mt-4 block text-sm font-medium text-navy">한국어 메모<textarea className={`${inputClass} mt-1.5 min-h-24 resize-y`} value={koreanDraft} onChange={(e) => setKoreanDraft(e.target.value)} placeholder="예: 카페에서 2년 일했고 친절하며 바쁜 시간에도 빠르고 정확하게 일합니다." /></label>
          <button type="button" onClick={createEnglishSuggestion} className="mt-3 min-h-11 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">영문 초안 만들기</button>
          {englishSuggestion && <div className="mt-4 rounded-xl bg-white p-4"><p className="text-sm leading-6 text-navy">{englishSuggestion}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => insertWriting(englishSuggestion, "summary")} className="min-h-11 rounded-lg border border-navy px-3 py-2 text-sm font-semibold text-navy">Summary에 추가</button><button type="button" onClick={() => insertWriting(englishSuggestion, "experience")} className="min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-medium text-navy">경력에 추가</button></div></div>}
          <p className="mt-3 text-xs leading-5 text-muted">직역 도구가 아닌 이력서 문장 제안 기능입니다. 사실과 경력 연수는 반드시 직접 확인하세요.</p>
        </section>

        <section className="mt-6" aria-labelledby="example-sentences-heading">
          <h2 id="example-sentences-heading" className="text-base font-semibold text-navy">바로 쓰는 예시 문장</h2>
          <div className="mt-3 space-y-3">{writingExamples.map((example) => <article key={example.en} className="rounded-xl border border-border p-4"><p className="text-xs leading-5 text-muted">{example.ko}</p><p className="mt-1 text-sm leading-6 text-navy">{example.en}</p><button type="button" onClick={() => insertWriting(example.en, example.target)} className="mt-2 min-h-11 text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">{example.target === "summary" ? "Summary에 추가" : "경력에 추가"}</button></article>)}</div>
        </section>

        <fieldset className="mt-7 space-y-4">
          <legend className="text-base font-semibold text-navy">기본 정보</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>이름<input className={inputClass} value={resume.name} onChange={(e) => setField("name", e.target.value)} placeholder="Jiwon Kim" /></label>
            <label className={labelClass}>희망 직무<input className={inputClass} value={resume.title} onChange={(e) => setField("title", e.target.value)} placeholder="Barista" /></label>
            <label className={labelClass}>전화번호<input className={inputClass} type="tel" value={resume.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="04xx xxx xxx" /></label>
            <label className={labelClass}>이메일<input className={inputClass} type="email" value={resume.email} onChange={(e) => setField("email", e.target.value)} placeholder="name@email.com" /></label>
            <label className={`${labelClass} sm:col-span-2`}>거주 지역<input className={inputClass} value={resume.location} onChange={(e) => setField("location", e.target.value)} placeholder="Sydney, NSW" /></label>
            <label className={`${labelClass} sm:col-span-2`}>LinkedIn 또는 포트폴리오 <span className="font-normal text-muted">(선택)</span><input className={inputClass} value={resume.link} onChange={(e) => setField("link", e.target.value)} placeholder="linkedin.com/in/your-name" /></label>
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-base font-semibold text-navy">Professional summary</legend>
          <label className="sr-only" htmlFor="resume-summary">Professional summary</label>
          <textarea id="resume-summary" className={`${inputClass} min-h-32 resize-y`} value={resume.summary} onChange={(e) => setField("summary", e.target.value)} placeholder="경험, 강점, 지원 직무를 3~4문장으로 요약하세요." />
        </fieldset>

        <fieldset className="mt-8 space-y-5">
          <legend className="text-base font-semibold text-navy">경력</legend>
          {resume.experiences.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-navy">경력 {index + 1}</h3><div className="flex items-center"><button type="button" disabled={index === 0} onClick={() => setResume((current) => ({ ...current, experiences: moveItem(current.experiences, index, index - 1) }))} className="min-h-11 px-2 text-sm text-muted disabled:opacity-30" aria-label={`경력 ${index + 1} 위로 이동`}>↑</button><button type="button" disabled={index === resume.experiences.length - 1} onClick={() => setResume((current) => ({ ...current, experiences: moveItem(current.experiences, index, index + 1) }))} className="min-h-11 px-2 text-sm text-muted disabled:opacity-30" aria-label={`경력 ${index + 1} 아래로 이동`}>↓</button>{resume.experiences.length > 1 && <button type="button" onClick={() => setResume((current) => ({ ...current, experiences: current.experiences.filter((entry) => entry.id !== item.id) }))} className="min-h-11 px-2 text-sm font-medium text-muted underline underline-offset-4 hover:text-navy">삭제</button>}</div></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>직무<input className={inputClass} value={item.role} onChange={(e) => updateExperience(item.id, "role", e.target.value)} placeholder="Barista" /></label>
                <label className={labelClass}>회사<input className={inputClass} value={item.company} onChange={(e) => updateExperience(item.id, "company", e.target.value)} placeholder="Compass Cafe" /></label>
                <label className={`${labelClass} sm:col-span-2`}>근무 기간<input className={inputClass} value={item.period} onChange={(e) => updateExperience(item.id, "period", e.target.value)} placeholder="Mar 2024 – Present" /></label>
                <label className={`${labelClass} sm:col-span-2`}>주요 성과 (한 줄에 하나씩)<textarea className={`${inputClass} min-h-28 resize-y`} value={item.details} onChange={(e) => updateExperience(item.id, "details", e.target.value)} placeholder={"Delivered friendly service to 100+ customers daily\nTrained two new team members"} /></label>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setResume((current) => ({ ...current, experiences: [...current.experiences, { id: makeId("experience"), role: "", company: "", period: "", details: "" }] }))} className="min-h-11 rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">+ 경력 추가</button>
        </fieldset>

        <fieldset className="mt-8 space-y-5">
          <legend className="text-base font-semibold text-navy">학력 및 교육</legend>
          {resume.education.map((item, index) => (
            <div key={item.id} className="rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-navy">학력 {index + 1}</h3><div className="flex items-center"><button type="button" disabled={index === 0} onClick={() => setResume((current) => ({ ...current, education: moveItem(current.education, index, index - 1) }))} className="min-h-11 px-2 text-sm text-muted disabled:opacity-30" aria-label={`학력 ${index + 1} 위로 이동`}>↑</button><button type="button" disabled={index === resume.education.length - 1} onClick={() => setResume((current) => ({ ...current, education: moveItem(current.education, index, index + 1) }))} className="min-h-11 px-2 text-sm text-muted disabled:opacity-30" aria-label={`학력 ${index + 1} 아래로 이동`}>↓</button>{resume.education.length > 1 && <button type="button" onClick={() => setResume((current) => ({ ...current, education: current.education.filter((entry) => entry.id !== item.id) }))} className="min-h-11 px-2 text-sm font-medium text-muted underline underline-offset-4 hover:text-navy">삭제</button>}</div></div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>과정·자격<input className={inputClass} value={item.course} onChange={(e) => updateEducation(item.id, "course", e.target.value)} placeholder="Certificate III in Hospitality" /></label>
                <label className={labelClass}>학교·교육기관<input className={inputClass} value={item.school} onChange={(e) => updateEducation(item.id, "school", e.target.value)} placeholder="TAFE NSW" /></label>
                <label className={`${labelClass} sm:col-span-2`}>기간<input className={inputClass} value={item.period} onChange={(e) => updateEducation(item.id, "period", e.target.value)} placeholder="2023 – 2024" /></label>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setResume((current) => ({ ...current, education: [...current.education, { id: makeId("education"), course: "", school: "", period: "" }] }))} className="min-h-11 rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">+ 학력 추가</button>
        </fieldset>

        <fieldset className="mt-8"><legend className="text-base font-semibold text-navy">Skills</legend><label className="mt-2 block text-sm text-muted">쉼표로 구분해 입력하세요<input className={inputClass} value={resume.skills} onChange={(e) => setField("skills", e.target.value)} placeholder="Customer service, POS, Coffee making" /></label></fieldset>
        <fieldset className="mt-8"><legend className="text-base font-semibold text-navy">자격증 및 라이선스 <span className="font-normal text-muted">(선택)</span></legend><label className="sr-only" htmlFor="resume-licences">자격증 및 라이선스</label><textarea id="resume-licences" className={`${inputClass} min-h-24 resize-y`} value={resume.licences} onChange={(e) => setField("licences", e.target.value)} placeholder={"NSW Responsible Service of Alcohol (RSA)\nWhite Card"} /></fieldset>
        <fieldset className="mt-8"><legend className="text-base font-semibold text-navy">언어 <span className="font-normal text-muted">(선택)</span></legend><label className="mt-2 block text-sm text-muted">쉼표로 구분해 입력하세요<input className={inputClass} value={resume.languages} onChange={(e) => setField("languages", e.target.value)} placeholder="Korean (Native), English (Professional)" /></label></fieldset>
        <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-2 text-sm text-navy"><input type="checkbox" checked={resume.showReferences} onChange={(e) => setResume((current) => ({ ...current, showReferences: e.target.checked }))} className="h-4 w-4 accent-navy" />References available upon request 문구 포함</label>
        {resumeReady && <section className="mt-8 border border-gold/50 bg-gold/5 p-5 sm:p-6" aria-labelledby="resume-next-step-heading">
          <p className="text-xs font-semibold tracking-[0.14em] text-gold">기본 이력서 준비 완료</p>
          <h2 id="resume-next-step-heading" className="mt-2 text-xl font-semibold text-navy">이제 어떻게 준비할까요?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">지금 만든 이력서는 무료로 저장할 수 있어요. 지원할 공고가 있다면 같은 내용을 다시 쓰지 않고 회사에 맞춰 이어서 준비할 수도 있고요.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => saveAsPdf("completion_choice")} className="flex min-h-24 flex-col items-start justify-center bg-navy px-5 py-4 text-left text-white hover:bg-navy-light">
              <strong className="text-base">무료 PDF로 저장하기</strong>
              <span className="mt-1 text-xs leading-5 text-white/65">인쇄 창에서 PDF 저장을 선택하세요.</span>
            </button>
            <TrackedLink href="/resume-pro?from=resume-builder-complete" eventName="Pro Interest" properties={{ product: "resume_pro", entry: "resume_builder_complete" }} className="flex min-h-24 flex-col items-start justify-center border border-navy bg-white px-5 py-4 text-left text-navy hover:bg-surface">
              <strong className="text-base">{resumeProLive ? "지원할 공고에 맞게 다듬기" : "공고 맞춤 준비 방식 보기"}</strong>
              <span className="mt-1 text-xs leading-5 text-muted">이력서·커버레터와 빠진 항목을 함께 확인해요.</span>
            </TrackedLink>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">무료 이력서는 그대로 이용할 수 있어요. Resume Pro는 경력을 새로 만들거나 취업 결과를 보장하는 기능이 아니에요.</p>
        </section>}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          {!resumeReady && <button type="button" onClick={() => saveAsPdf("builder_actions")} className="min-h-12 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-light">인쇄 · PDF 저장</button>}
          <button type="button" onClick={copyTextResume} className="min-h-12 rounded-lg border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-surface">텍스트 복사</button>
          <button type="button" onClick={exportDraft} className="min-h-12 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface">작성본 백업</button>
          <button type="button" onClick={() => importInputRef.current?.click()} className="min-h-12 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-navy hover:bg-surface">백업 불러오기</button>
          <input ref={importInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void importDraft(e.target.files?.[0])} aria-label="이력서 백업 파일 선택" />
          <button type="button" onClick={clearResume} className="min-h-12 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted hover:border-navy/30 hover:text-navy">내용 지우기</button>
        </div>
        <p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">{actionMessage}</p>
      </section>

      <div className="xl:sticky xl:top-24">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-navy">미리보기</h2><p className="text-xs text-muted">A4 형식</p></div>
        <article id="resume-preview" className={`min-h-[877px] bg-white text-[#202636] shadow-lg ring-1 ring-black/5 ${resume.layoutStyle === "compact" ? "px-7 py-8 sm:px-10 sm:py-9" : "px-8 py-10 sm:px-12 sm:py-12"}`} aria-label="이력서 미리보기">
          <header className={`${resume.layoutStyle === "compact" ? "border-b pb-3" : "border-b-2 pb-5"}`} style={{ borderColor: activeAccent.colour }}>
            <h1 className={`${resume.layoutStyle === "compact" ? "text-2xl" : "text-3xl"} font-bold tracking-tight`} style={{ color: activeAccent.colour }}>{resume.name || "Your Name"}</h1>
            <p className="mt-1 text-base font-semibold" style={{ color: activeAccent.secondary }}>{resume.title || "Target Role"}</p>
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#50586b]">{[resume.phone || "Phone", resume.email || "Email", resume.location || "City, State", resume.link].filter(Boolean).map((value, index) => <span key={index}>{value}</span>)}</p>
          </header>
          <div className={resume.layoutStyle === "compact" ? "mt-4 space-y-4" : "mt-6 space-y-6"} style={{ "--resume-accent": activeAccent.colour } as React.CSSProperties}>
            {(resume.summary || !resume.name) && <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">Professional Summary</h2><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#3f4655]">{resume.summary || "Write a concise summary of your experience, strengths and the value you bring to the role."}</p></section>}
            <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">Experience</h2><div className="mt-3 space-y-5">{resume.experiences.map((item) => <div key={item.id}><div className="flex items-start justify-between gap-5"><div><h3 className="text-sm font-bold">{item.role || "Role"}</h3><p className="text-sm text-[#50586b]">{item.company || "Company"}</p></div><p className="shrink-0 text-xs text-[#50586b]">{item.period || "Dates"}</p></div>{item.details && <ul className="mt-2 space-y-1 text-sm leading-5 text-[#3f4655]">{item.details.split("\n").filter(Boolean).map((line, i) => <li key={i} className="flex gap-2"><span aria-hidden="true">•</span><span>{line}</span></li>)}</ul>}</div>)}</div></section>
            <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">Education & Training</h2><div className="mt-3 space-y-4">{resume.education.map((item) => <div key={item.id} className="flex items-start justify-between gap-5"><div><h3 className="text-sm font-bold">{item.course || "Course or qualification"}</h3><p className="text-sm text-[#50586b]">{item.school || "Institution"}</p></div><p className="shrink-0 text-xs text-[#50586b]">{item.period || "Dates"}</p></div>)}</div></section>
            {(skills.length > 0 || !resume.name) && <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">Skills</h2><ul className="mt-3 flex flex-wrap gap-2">{(skills.length ? skills : ["Customer service", "Teamwork", "Communication"]).map((skill) => <li key={skill} className="rounded bg-[#f1efe9] px-2.5 py-1 text-xs text-[#303747]">{skill}</li>)}</ul></section>}
            {licences.length > 0 && <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">Licences & Certifications</h2><ul className="mt-3 grid gap-1 text-sm text-[#3f4655]">{licences.map((item) => <li key={item}>{item}</li>)}</ul></section>}
            {languages.length > 0 && <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">Languages</h2><p className="mt-3 text-sm text-[#3f4655]">{languages.join(" · ")}</p></section>}
            {resume.showReferences && <section><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#1a2744]">References</h2><p className="mt-3 text-sm text-[#3f4655]">Available upon request</p></section>}
          </div>
        </article>
      </div>
    </div>
  );
}
