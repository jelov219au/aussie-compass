"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import {
  resumeProApplicationsStorageKey,
  resumeProDevicePurgeEventName,
  resumeProDraftStorageKey,
  resumeProStarStoriesStorageKey,
  resumeStorageKey,
} from "@/lib/resumeProDeviceStorage";

import {
  buildInterviewQuestions,
  composeStarAnswer,
  hasStarContent,
  type InterviewQuestion,
} from "@/lib/resumeInterviewPrep";
import {
  persistResumeProApplicationStore,
  readResumeProApplicationStore,
  type ResumeProApplicationStore,
  type ResumeProStoredApplication,
} from "@/lib/resumeProApplicationStorage";

type Tone = "clear" | "warm" | "concise";
type ProLayout = "editorial" | "split" | "minimal";
type ProAccent = "eucalyptus" | "ocean" | "terracotta";
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
  showReferences?: boolean;
  experiences?: Array<{ role?: string; company?: string; period?: string; details?: string }>;
  education?: Array<{ course?: string; school?: string; period?: string }>;
};
type ProDraft = {
  company: string;
  role: string;
  hiringManager: string;
  jobAd: string;
  tone: Tone;
  layout: ProLayout;
  accent: ProAccent;
  coverLetter: string;
  starStoryId: string;
  interviewQuestions: InterviewQuestion[];
  interviewAnswers: Record<string, string>;
};
type StarStory = {
  id: string;
  title: string;
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  updatedAt: string;
};
type StarStoryDraft = Omit<StarStory, "id" | "updatedAt">;
type SavedApplication = ResumeProStoredApplication<ProDraft>;
type ApplicationStore = ResumeProApplicationStore<ProDraft>;

const STAR_STORY_LIMIT = 20;
const emptyStarStory: StarStoryDraft = { title: "", competency: "", situation: "", task: "", action: "", result: "" };
const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";
const labelClass = "block text-sm font-medium text-navy";
const proLayouts: Array<{ id: ProLayout; name: string; description: string }> = [
  { id: "editorial", name: "Editorial", description: "서비스·호스피탈리티에 잘 어울리는 선명한 구성" },
  { id: "split", name: "Professional", description: "연락처와 역량을 분리한 오피스형 구성" },
  { id: "minimal", name: "Technical", description: "경력과 자격을 빠르게 읽는 간결한 구성" },
];
const proAccents: Record<ProAccent, { name: string; primary: string; secondary: string; soft: string }> = {
  eucalyptus: { name: "유칼립투스", primary: "#315f4e", secondary: "#a67c2e", soft: "#edf4f1" },
  ocean: { name: "오션", primary: "#244b70", secondary: "#b17d32", soft: "#edf3f8" },
  terracotta: { name: "테라코타", primary: "#8f4f3d", secondary: "#786433", soft: "#f7efeb" },
};
const initialDraft: ProDraft = {
  company: "",
  role: "",
  hiringManager: "",
  jobAd: "",
  tone: "clear",
  layout: "editorial",
  accent: "eucalyptus",
  coverLetter: "",
  starStoryId: "",
  interviewQuestions: [],
  interviewAnswers: {},
};
const stopWords = new Set([
  "about", "after", "also", "and", "are", "been", "being", "but", "can", "company", "experience", "from", "have", "include", "includes", "into", "job", "more", "must", "our", "position", "preparing", "required", "requirements", "responsibilities", "role", "seeking", "that", "the", "their", "this", "through", "using", "will", "with", "work", "you", "your",
]);

function normaliseDraft(value: unknown, fallback: ProDraft = initialDraft): ProDraft {
  if (!value || typeof value !== "object") return fallback;
  const stored = value as Partial<Record<keyof ProDraft, unknown>>;
  const storedQuestions = Array.isArray(stored.interviewQuestions)
    ? stored.interviewQuestions.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const question = item as Partial<Record<keyof InterviewQuestion, unknown>>;
      return typeof question.id === "string"
        && typeof question.focus === "string"
        && typeof question.question === "string"
        && typeof question.prompt === "string"
        ? [{ id: question.id, focus: question.focus, question: question.question, prompt: question.prompt }]
        : [];
    }).slice(0, 10)
    : fallback.interviewQuestions;
  const storedAnswers = stored.interviewAnswers && typeof stored.interviewAnswers === "object" && !Array.isArray(stored.interviewAnswers)
    ? Object.fromEntries(Object.entries(stored.interviewAnswers).filter((entry): entry is [string, string] => typeof entry[1] === "string").slice(0, 20))
    : fallback.interviewAnswers;
  const stringValue = <K extends "company" | "role" | "hiringManager" | "jobAd" | "coverLetter" | "starStoryId">(field: K) => typeof stored[field] === "string" ? stored[field] : fallback[field];
  return {
    company: stringValue("company"),
    role: stringValue("role"),
    hiringManager: stringValue("hiringManager"),
    jobAd: stringValue("jobAd"),
    tone: stored.tone === "clear" || stored.tone === "warm" || stored.tone === "concise" ? stored.tone : fallback.tone,
    layout: stored.layout === "editorial" || stored.layout === "split" || stored.layout === "minimal" ? stored.layout : fallback.layout,
    accent: stored.accent === "eucalyptus" || stored.accent === "ocean" || stored.accent === "terracotta" ? stored.accent : fallback.accent,
    coverLetter: stringValue("coverLetter"),
    starStoryId: stringValue("starStoryId"),
    interviewQuestions: storedQuestions,
    interviewAnswers: storedAnswers,
  };
}

function toStarStoryDraft(story: StarStory): StarStoryDraft {
  const { id: _id, updatedAt: _updatedAt, ...editable } = story;
  void _id;
  void _updatedAt;
  return editable;
}

function readSavedResume(): SavedResume {
  try {
    return JSON.parse(window.localStorage.getItem(resumeStorageKey) || "{}") as SavedResume;
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

function listValues(value?: string, separator = /,|\n/) {
  return value?.split(separator).map((item) => item.trim()).filter(Boolean) ?? [];
}

type ResumeExperience = NonNullable<SavedResume["experiences"]>[number];
type ResumeEducation = NonNullable<SavedResume["education"]>[number];

function ResumeExperienceList({ experiences, compact = false }: { experiences: ResumeExperience[]; compact?: boolean }) {
  const items = experiences.length
    ? experiences
    : [{ role: "Role", company: "Company", period: "Dates", details: "Add achievements in the free resume builder." }];

  return <div className={compact ? "mt-3 space-y-4" : "mt-4 space-y-5"}>{items.map((item, index) => <div key={`${item.role}-${item.company}-${index}`}><div className="flex items-start justify-between gap-5"><div><h3 className="text-sm font-bold text-[#202636]">{item.role || "Role"}</h3><p className="text-sm text-[#50586b]">{item.company || "Company"}</p></div><p className="shrink-0 text-xs text-[#687083]">{item.period || "Dates"}</p></div>{item.details && <ul className="mt-2 space-y-1 text-sm leading-5 text-[#3f4655]">{item.details.split("\n").filter(Boolean).map((line, lineIndex) => <li key={lineIndex} className="flex gap-2"><span aria-hidden="true">•</span><span>{line}</span></li>)}</ul>}</div>)}</div>;
}

function ResumeEducationList({ education }: { education: ResumeEducation[] }) {
  const items = education.length
    ? education
    : [{ course: "Course or qualification", school: "Institution", period: "Dates" }];

  return <div className="mt-3 space-y-3">{items.map((item, index) => <div key={`${item.course}-${item.school}-${index}`} className="flex items-start justify-between gap-5"><div><h3 className="text-sm font-bold text-[#202636]">{item.course || "Course or qualification"}</h3><p className="text-sm text-[#50586b]">{item.school || "Institution"}</p></div><p className="shrink-0 text-xs text-[#687083]">{item.period || "Dates"}</p></div>)}</div>;
}

function ResumeSectionHeading({ color, children }: { color: string; children: ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color }}>{children}</h2>;
}

function ResumeProDocument({ resume, layout, accent }: { resume: SavedResume; layout: ProLayout; accent: ProAccent }) {
  const palette = proAccents[accent];
  const skills = listValues(resume.skills);
  const licences = listValues(resume.licences, /\n/);
  const languages = listValues(resume.languages);
  const experiences = resume.experiences?.filter((item) => item.role || item.company || item.details) ?? [];
  const education = resume.education?.filter((item) => item.course || item.school) ?? [];
  const contact = [resume.phone || "Phone", resume.email || "Email", resume.location || "City, State", resume.link].filter(Boolean);

  if (layout === "split") return <article id="resume-pro-preview" className="min-h-[1120px] overflow-hidden bg-white text-[#202636] shadow-lg ring-1 ring-black/5 sm:grid sm:grid-cols-[14rem_1fr]" aria-label="Professional 프리미엄 이력서 미리보기">
    <aside className="p-7 text-white sm:min-h-[1120px]" style={{ backgroundColor: palette.primary }}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Contact</p><ul className="mt-4 space-y-2 text-xs leading-5 text-white/85">{contact.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className="mt-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Skills</p><ul className="mt-4 space-y-2 text-sm">{(skills.length ? skills : ["Customer service", "Teamwork", "Communication"]).map((item) => <li key={item} className="border-b border-white/15 pb-2">{item}</li>)}</ul></div>
      {licences.length > 0 && <div className="mt-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Licences</p><ul className="mt-4 space-y-2 text-xs leading-5 text-white/85">{licences.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      {languages.length > 0 && <div className="mt-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Languages</p><p className="mt-4 text-xs leading-5 text-white/85">{languages.join(" · ")}</p></div>}
    </aside>
    <div className="p-8 sm:p-10"><header className="border-b pb-6" style={{ borderColor: palette.secondary }}><p className="text-4xl font-semibold tracking-tight" style={{ color: palette.primary }}>{resume.name || "Your Name"}</p><p className="mt-2 text-lg font-semibold" style={{ color: palette.secondary }}>{resume.title || "Target Role"}</p></header><div className="mt-7 space-y-7">{(resume.summary || !resume.name) && <section><ResumeSectionHeading color={palette.primary}>Professional Summary</ResumeSectionHeading><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#3f4655]">{resume.summary || "Write a concise summary of your experience, strengths and the value you bring to the role."}</p></section>}<section><ResumeSectionHeading color={palette.primary}>Experience</ResumeSectionHeading><ResumeExperienceList experiences={experiences} /></section><section><ResumeSectionHeading color={palette.primary}>Education & Training</ResumeSectionHeading><ResumeEducationList education={education} /></section>{resume.showReferences && <section><ResumeSectionHeading color={palette.primary}>References</ResumeSectionHeading><p className="mt-3 text-sm text-[#3f4655]">Available upon request</p></section>}</div></div>
  </article>;

  if (layout === "minimal") return <article id="resume-pro-preview" className="min-h-[1120px] bg-white px-8 py-10 text-[#202636] shadow-lg ring-1 ring-black/5 sm:px-14 sm:py-14" aria-label="Technical 프리미엄 이력서 미리보기">
    <header><p className="text-4xl font-semibold tracking-[-0.03em] text-[#202636]">{resume.name || "Your Name"}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#202636] pb-5"><p className="text-base font-semibold" style={{ color: palette.primary }}>{resume.title || "Target Role"}</p><p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#687083]">{contact.map((item) => <span key={item}>{item}</span>)}</p></div></header>
    <div className="mt-8 grid gap-8 sm:grid-cols-[10rem_1fr]"><aside className="space-y-8">{skills.length > 0 && <section><ResumeSectionHeading color={palette.primary}>Core Skills</ResumeSectionHeading><ul className="mt-3 space-y-2 text-xs leading-5 text-[#3f4655]">{skills.map((item) => <li key={item}>{item}</li>)}</ul></section>}{licences.length > 0 && <section><ResumeSectionHeading color={palette.primary}>Licences</ResumeSectionHeading><ul className="mt-3 space-y-2 text-xs leading-5 text-[#3f4655]">{licences.map((item) => <li key={item}>{item}</li>)}</ul></section>}{languages.length > 0 && <section><ResumeSectionHeading color={palette.primary}>Languages</ResumeSectionHeading><p className="mt-3 text-xs leading-5 text-[#3f4655]">{languages.join(" · ")}</p></section>}</aside><div className="space-y-7">{resume.summary && <section><ResumeSectionHeading color={palette.primary}>Profile</ResumeSectionHeading><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#3f4655]">{resume.summary}</p></section>}<section><ResumeSectionHeading color={palette.primary}>Experience</ResumeSectionHeading><ResumeExperienceList experiences={experiences} compact /></section><section><ResumeSectionHeading color={palette.primary}>Education & Training</ResumeSectionHeading><ResumeEducationList education={education} /></section>{resume.showReferences && <section><ResumeSectionHeading color={palette.primary}>References</ResumeSectionHeading><p className="mt-3 text-sm text-[#3f4655]">Available upon request</p></section>}</div></div>
  </article>;

  return <article id="resume-pro-preview" className="min-h-[1120px] bg-white px-8 py-10 text-[#202636] shadow-lg ring-1 ring-black/5 sm:px-14 sm:py-14" aria-label="Editorial 프리미엄 이력서 미리보기">
    <header className="border-t-[10px] pt-8" style={{ borderColor: palette.primary }}><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-4xl font-semibold tracking-[-0.035em]" style={{ color: palette.primary }}>{resume.name || "Your Name"}</p><p className="mt-2 text-lg font-semibold" style={{ color: palette.secondary }}>{resume.title || "Target Role"}</p></div><p className="max-w-sm text-right text-xs leading-5 text-[#687083]">{contact.join(" · ")}</p></div></header>
    <div className="mt-9 space-y-8">{(resume.summary || !resume.name) && <section className="border-l-4 p-5" style={{ borderColor: palette.secondary, backgroundColor: palette.soft }}><ResumeSectionHeading color={palette.primary}>Professional Summary</ResumeSectionHeading><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#3f4655]">{resume.summary || "Write a concise summary of your experience, strengths and the value you bring to the role."}</p></section>}<section><ResumeSectionHeading color={palette.primary}>Experience</ResumeSectionHeading><ResumeExperienceList experiences={experiences} /></section><section><ResumeSectionHeading color={palette.primary}>Education & Training</ResumeSectionHeading><ResumeEducationList education={education} /></section><div className="grid gap-6 border-t border-[#d8dbe2] pt-6 sm:grid-cols-2">{skills.length > 0 && <section><ResumeSectionHeading color={palette.primary}>Skills</ResumeSectionHeading><p className="mt-3 text-sm leading-6 text-[#3f4655]">{skills.join(" · ")}</p></section>}{licences.length > 0 && <section><ResumeSectionHeading color={palette.primary}>Licences & Certifications</ResumeSectionHeading><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#3f4655]">{licences.join("\n")}</p></section>}{languages.length > 0 && <section><ResumeSectionHeading color={palette.primary}>Languages</ResumeSectionHeading><p className="mt-3 text-sm text-[#3f4655]">{languages.join(" · ")}</p></section>}{resume.showReferences && <section><ResumeSectionHeading color={palette.primary}>References</ResumeSectionHeading><p className="mt-3 text-sm text-[#3f4655]">Available upon request</p></section>}</div></div>
  </article>;
}

export function ResumeProWorkspace() {
  const router = useRouter();
  const [savedResume, setSavedResume] = useState<SavedResume>({});
  const [draft, setDraft] = useState<ProDraft>(initialDraft);
  const [applications, setApplications] = useState<SavedApplication[]>([]);
  const [starStories, setStarStories] = useState<StarStory[]>([]);
  const [starStoryDraft, setStarStoryDraft] = useState<StarStoryDraft>(emptyStarStory);
  const [editingStarStoryId, setEditingStarStoryId] = useState<string | null>(null);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const purgingRef = useRef(false);
  const draftSaveTimerRef = useRef<number | null>(null);
  const applicationsSaveTimerRef = useRef<number | null>(null);
  const starStoriesSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSavedResume(readSavedResume());
    try {
      const stored = window.localStorage.getItem(resumeProDraftStorageKey);
      if (stored) setDraft((current) => normaliseDraft(JSON.parse(stored), current));
    } catch {
      // The preview remains usable when local storage is unavailable.
    }
    const applicationRead = readResumeProApplicationStore(
      window.localStorage,
      resumeProApplicationsStorageKey,
      (value) => normaliseDraft(value),
      (value) => ({ company: value.company, role: value.role }),
    );
    setApplications(applicationRead.store.items);
    setActiveApplicationId(applicationRead.store.activeId);
    if (applicationRead.status === "recovered") setMessage("손상되거나 중복된 회사별 지원서 항목을 제외하고 안전하게 복구했습니다.");
    if (applicationRead.status === "unavailable") setMessage("이 브라우저의 저장공간을 확인할 수 없습니다. 작업 내용을 별도 파일로 백업해 주세요.");
    try {
      const storedStarStories = window.localStorage.getItem(resumeProStarStoriesStorageKey);
      if (storedStarStories) {
        const parsed = JSON.parse(storedStarStories) as unknown;
        if (Array.isArray(parsed)) setStarStories(parsed.slice(0, STAR_STORY_LIMIT) as StarStory[]);
      }
    } catch {
      // A damaged STAR store must not block company-application recovery.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handleDevicePurge = () => {
      purgingRef.current = true;
      [draftSaveTimerRef, applicationsSaveTimerRef, starStoriesSaveTimerRef].forEach((timerRef) => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = null;
      });
      setLoaded(false);
      setSavedResume({});
      setDraft(initialDraft);
      setApplications([]);
      setStarStories([]);
      setStarStoryDraft(emptyStarStory);
      setEditingStarStoryId(null);
      setActiveApplicationId(null);
      setMessage("");
    };
    window.addEventListener(resumeProDevicePurgeEventName, handleDevicePurge);
    return () => window.removeEventListener(resumeProDevicePurgeEventName, handleDevicePurge);
  }, []);

  useEffect(() => {
    if (!loaded || purgingRef.current) return;
    draftSaveTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(resumeProDraftStorageKey, JSON.stringify(draft));
      } catch {
        // The preview remains usable when local storage is unavailable.
      }
    }, 400);
    return () => {
      if (draftSaveTimerRef.current !== null) window.clearTimeout(draftSaveTimerRef.current);
      draftSaveTimerRef.current = null;
    };
  }, [draft, loaded]);

  useEffect(() => {
    if (!loaded || purgingRef.current) return;
    applicationsSaveTimerRef.current = window.setTimeout(() => {
      const saved = persistResumeProApplicationStore(window.localStorage, resumeProApplicationsStorageKey, {
        activeId: activeApplicationId,
        items: applications,
      } satisfies ApplicationStore);
      if (!saved) setMessage("회사별 지원서를 기기에 저장하지 못했습니다. 브라우저 저장공간을 확인하고 다시 저장해 주세요.");
    }, 400);
    return () => {
      if (applicationsSaveTimerRef.current !== null) window.clearTimeout(applicationsSaveTimerRef.current);
      applicationsSaveTimerRef.current = null;
    };
  }, [activeApplicationId, applications, loaded]);

  useEffect(() => {
    if (!loaded || purgingRef.current) return;
    starStoriesSaveTimerRef.current = window.setTimeout(() => {
      try { window.localStorage.setItem(resumeProStarStoriesStorageKey, JSON.stringify(starStories.slice(0, STAR_STORY_LIMIT))); } catch {}
    }, 400);
    return () => {
      if (starStoriesSaveTimerRef.current !== null) window.clearTimeout(starStoriesSaveTimerRef.current);
      starStoriesSaveTimerRef.current = null;
    };
  }, [loaded, starStories]);

  useEffect(() => {
    if (!loaded || !draft.starStoryId) return;
    const linkedStory = starStories.find((story) => story.id === draft.starStoryId);
    if (!linkedStory) return;
    setStarStoryDraft(toStarStoryDraft(linkedStory));
    setEditingStarStoryId(linkedStory.id);
  }, [draft.starStoryId, loaded, starStories]);

  const resumeText = useMemo(() => JSON.stringify(savedResume).toLowerCase(), [savedResume]);
  const keywords = useMemo(() => extractKeywords(draft.jobAd), [draft.jobAd]);
  const matched = useMemo(() => keywords.filter((keyword) => resumeText.includes(keyword)), [keywords, resumeText]);
  const missing = useMemo(() => keywords.filter((keyword) => !resumeText.includes(keyword)), [keywords, resumeText]);
  const matchRate = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
  const hasResume = Boolean(savedResume.name || savedResume.summary || savedResume.experiences?.some((item) => item.role || item.details));
  const selectedStarStory = useMemo(() => starStories.find((story) => story.id === draft.starStoryId) ?? null, [draft.starStoryId, starStories]);
  const starAnswer = useMemo(() => composeStarAnswer(starStoryDraft), [starStoryDraft]);
  const activeApplication = useMemo(() => applications.find((application) => application.id === activeApplicationId) ?? null, [activeApplicationId, applications]);
  const currentApplicationSaved = Boolean(activeApplication?.updatedAt && JSON.stringify(activeApplication.draft) === JSON.stringify(draft));
  const quickStartSteps = [
    { id: "resume", label: "무료 이력서 연결", done: hasResume },
    { id: "application", label: "회사와 직무 입력", done: Boolean(draft.company.trim() && (draft.role.trim() || savedResume.title?.trim())) },
    { id: "job-ad", label: "채용 공고 붙여넣기", done: Boolean(draft.jobAd.trim()) },
    { id: "cover-letter", label: "첫 커버레터 초안 만들기", done: Boolean(draft.coverLetter.trim()) },
    { id: "save-application", label: "회사별 지원서 저장", done: currentApplicationSaved },
  ];
  const quickStartCompleted = quickStartSteps.filter((step) => step.done).length;

  const setField = <K extends keyof ProDraft>(field: K, value: ProDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));

  const continueQuickStart = () => {
    const next = quickStartSteps.find((step) => !step.done);
    if (!next) {
      document.getElementById("resume-pro-interview-prep")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (next.id === "resume") {
      router.push("/resume-builder");
      return;
    }
    const targetId = next.id === "application"
      ? "resume-pro-company"
      : next.id === "job-ad"
        ? "resume-pro-job-ad"
        : next.id === "cover-letter"
          ? "resume-pro-cover-letter-action"
          : "resume-pro-save-application";
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => target?.focus(), 350);
  };

  const refreshResume = () => {
    const next = readSavedResume();
    setSavedResume(next);
    setMessage(next.name || next.summary ? "무료 빌더의 최신 이력서를 불러왔습니다." : "저장된 이력서가 없습니다. 무료 빌더에서 먼저 작성해 주세요.");
  };

  const saveApplication = () => {
    const company = draft.company.trim();
    const role = draft.role.trim() || savedResume.title?.trim() || "지원 직무 미정";
    if (!company) {
      setMessage("회사명을 입력한 뒤 회사별 지원서로 저장해 주세요.");
      return;
    }
    const id = activeApplicationId || `application-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved: SavedApplication = { id, company, role, updatedAt: new Date().toISOString(), draft };
    const nextApplications = [saved, ...applications.filter((item) => item.id !== id)].slice(0, 30);
    if (applicationsSaveTimerRef.current !== null) window.clearTimeout(applicationsSaveTimerRef.current);
    applicationsSaveTimerRef.current = null;
    if (!persistResumeProApplicationStore(window.localStorage, resumeProApplicationsStorageKey, { activeId: id, items: nextApplications })) {
      setMessage("회사별 지원서를 기기에 저장하지 못했습니다. 브라우저 저장공간을 확인하고 다시 저장해 주세요.");
      return;
    }
    setApplications(nextApplications);
    setActiveApplicationId(id);
    setMessage(`${company} 지원서를 저장했습니다.`);
  };

  const loadApplication = (application: SavedApplication) => {
    const nextDraft = normaliseDraft(application.draft, draft);
    setDraft(nextDraft);
    const linkedStory = starStories.find((story) => story.id === nextDraft.starStoryId);
    setStarStoryDraft(linkedStory ? toStarStoryDraft(linkedStory) : emptyStarStory);
    setEditingStarStoryId(linkedStory?.id ?? null);
    setActiveApplicationId(application.id);
    setMessage(`${application.company} 지원서를 불러왔습니다.`);
  };

  const startNewApplication = () => {
    setDraft((current) => ({ ...initialDraft, role: savedResume.title || "", tone: current.tone, layout: current.layout, accent: current.accent }));
    setActiveApplicationId(null);
    setMessage("새 지원서를 시작했습니다. 기존에 목록에 저장한 지원서는 그대로 남아 있습니다.");
  };

  const deleteApplication = (application: SavedApplication) => {
    if (!window.confirm(`${application.company} 지원서를 목록에서 삭제할까요?`)) return;
    setApplications((current) => current.filter((item) => item.id !== application.id));
    if (activeApplicationId === application.id) setActiveApplicationId(null);
    setMessage(`${application.company} 지원서를 목록에서 삭제했습니다.`);
  };

  const setStarField = <K extends keyof StarStoryDraft>(field: K, value: StarStoryDraft[K]) => setStarStoryDraft((current) => ({ ...current, [field]: value }));

  const saveStarStory = () => {
    if (!editingStarStoryId && starStories.length >= STAR_STORY_LIMIT) {
      setMessage(`STAR 경험은 최대 ${STAR_STORY_LIMIT}개까지 저장할 수 있습니다. 기존 경험을 삭제한 뒤 새 경험을 추가해 주세요.`);
      return;
    }
    if (!starStoryDraft.title.trim() || !starStoryDraft.action.trim() || !starStoryDraft.result.trim()) {
      setMessage("경험 이름, 내가 한 행동과 결과를 입력해 주세요.");
      return;
    }
    const id = editingStarStoryId || `star-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const story: StarStory = {
      id,
      title: starStoryDraft.title.trim(),
      competency: starStoryDraft.competency.trim(),
      situation: starStoryDraft.situation.trim(),
      task: starStoryDraft.task.trim(),
      action: starStoryDraft.action.trim(),
      result: starStoryDraft.result.trim(),
      updatedAt: new Date().toISOString(),
    };
    setStarStories((current) => [story, ...current.filter((item) => item.id !== id)].slice(0, STAR_STORY_LIMIT));
    setEditingStarStoryId(id);
    setField("starStoryId", id);
    setMessage("STAR 경험을 저장하고 현재 지원서에 연결했습니다.");
  };

  const applyStarStory = (story: StarStory) => {
    setStarStoryDraft(toStarStoryDraft(story));
    setEditingStarStoryId(story.id);
    setField("starStoryId", story.id);
    setMessage(`‘${story.title}’ 경험을 현재 지원서에 연결했습니다.`);
  };

  const startNewStarStory = () => {
    if (starStories.length >= STAR_STORY_LIMIT) {
      setMessage(`STAR 경험은 최대 ${STAR_STORY_LIMIT}개까지 저장할 수 있습니다. 기존 경험을 삭제한 뒤 새 경험을 추가해 주세요.`);
      return;
    }
    setStarStoryDraft(emptyStarStory);
    setEditingStarStoryId(null);
    setMessage("새 STAR 경험을 작성할 수 있습니다. 저장된 경험은 그대로 남아 있습니다.");
  };

  const deleteStarStory = (story: StarStory) => {
    if (!window.confirm(`‘${story.title}’ 경험을 보관함에서 삭제할까요?`)) return;
    setStarStories((current) => current.filter((item) => item.id !== story.id));
    if (draft.starStoryId === story.id) setField("starStoryId", "");
    if (editingStarStoryId === story.id) startNewStarStory();
    setMessage(`‘${story.title}’ 경험을 삭제했습니다.`);
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

  const createInterviewQuestions = () => {
    const questions = buildInterviewQuestions({
      company: draft.company,
      role: draft.role || savedResume.title || "",
      keywords,
    });
    setDraft((current) => ({
      ...current,
      interviewQuestions: questions,
      interviewAnswers: Object.fromEntries(questions.map((question) => [question.id, current.interviewAnswers[question.id] || ""])),
    }));
    setStarStoryDraft((current) => current.competency ? current : { ...current, competency: keywords[0] || "" });
    setMessage("채용 공고를 바탕으로 면접 질문을 준비했습니다. 실제 경험에 맞춰 답변 메모를 채워 주세요.");
  };

  const setInterviewAnswer = (id: string, value: string) => {
    setDraft((current) => ({ ...current, interviewAnswers: { ...current.interviewAnswers, [id]: value } }));
  };

  const copyStarAnswer = async () => {
    if (!starAnswer) return;
    try {
      await navigator.clipboard.writeText(starAnswer);
      setMessage("STAR 답변을 복사했습니다.");
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
      "REUSABLE STAR EXPERIENCE",
      ...(selectedStarStory ? [
        `Title: ${selectedStarStory.title}`,
        `Competency: ${selectedStarStory.competency || "Not set"}`,
        `Situation: ${selectedStarStory.situation || "Not set"}`,
        `Task: ${selectedStarStory.task || "Not set"}`,
        `Action: ${selectedStarStory.action}`,
        `Result: ${selectedStarStory.result}`,
      ] : ["No STAR experience selected for this application."]),
      "",
      "COVER LETTER",
      draft.coverLetter || "Not created",
      "",
      "INTERVIEW PREPARATION",
      ...(draft.interviewQuestions.length
        ? draft.interviewQuestions.flatMap((question, index) => [
          `${index + 1}. [${question.focus}] ${question.question}`,
          draft.interviewAnswers[question.id]?.trim() || "   Answer notes not written",
          "",
        ])
        : ["Interview questions not created", ""]),
      "This file is a personal preparation copy. Review every statement before submitting and store it securely because it may contain contact and employment details.",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(`${draft.company}-${draft.role || savedResume.title || "application"}`)}-application-kit.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("이력서 요약, 공고 점검, STAR 경험, 면접 메모와 커버레터를 지원서 패키지로 저장했습니다.");
  };

  return (
    <div className="space-y-12">
    <section className="border border-navy/15 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="resume-pro-quick-start-heading">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">첫 10분 빠른 시작</p><h2 id="resume-pro-quick-start-heading" className="mt-2 text-2xl font-semibold text-navy">첫 회사별 지원서 하나를 저장해보세요.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">디자인과 면접 준비는 나중에 해도 괜찮아요. 저장한 이력서와 공고로 커버레터를 만든 뒤 회사별 지원서로 저장하면, 다음 공고를 시작해도 이번 준비를 다시 열어 비교할 수 있어요.</p></div>
        <div className="min-w-48"><p className="font-mono text-sm text-muted">{quickStartCompleted} / {quickStartSteps.length} 완료</p><div className="mt-2 h-2 overflow-hidden bg-surface" aria-hidden="true"><div className="h-full bg-gold transition-[width]" style={{ width: `${(quickStartCompleted / quickStartSteps.length) * 100}%` }} /></div></div>
      </div>
      <ol className="mt-6 grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-5">{quickStartSteps.map((step, index) => <li key={step.id} className="flex min-h-20 items-center gap-3 bg-surface px-4 py-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${step.done ? "bg-[#315f4e] text-white" : "border border-navy/25 bg-white text-navy"}`}>{step.done ? "✓" : index + 1}</span><span className={`text-sm ${step.done ? "font-medium text-navy" : "text-muted"}`}>{step.label}</span></li>)}</ol>
      <div className="mt-5 flex flex-wrap items-center gap-4"><button type="button" onClick={continueQuickStart} className="min-h-12 bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">{quickStartCompleted === quickStartSteps.length ? "면접 준비로 이동" : "다음 할 일 바로가기"}</button><p className="text-xs leading-5 text-muted">입력 내용은 현재 브라우저에 자동 저장됩니다.</p></div>
    </section>
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(34rem,1.08fr)]">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="pro-input-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application brief</p><h2 id="pro-input-heading" className="mt-2 text-2xl font-semibold text-navy">지원할 회사와 공고</h2></div>
          <button type="button" onClick={refreshResume} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">이력서 다시 불러오기</button>
        </div>
        <div className={`mt-5 border-l-2 p-4 text-sm leading-6 ${hasResume ? "border-[#3f6d5c] bg-[#3f6d5c]/8 text-navy" : "border-gold bg-gold/8 text-muted"}`}>
          {hasResume ? <><strong className="block text-navy">{savedResume.name || "저장된 이력서"}의 내용을 연결했습니다.</strong>무료 이력서 빌더의 Summary, 경력과 Skills를 초안에 사용합니다.</> : <><strong className="block text-navy">저장된 이력서를 찾지 못했습니다.</strong>입력 없이도 사용할 수 있지만 무료 빌더를 먼저 작성하면 더 구체적인 초안이 만들어집니다.</>}
        </div>
        <section className="mt-5 border border-border bg-white p-4" aria-labelledby="saved-applications-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 id="saved-applications-heading" className="text-sm font-semibold text-navy">회사별 지원서</h3><p className="mt-1 text-xs leading-5 text-muted">현재 브라우저에 최대 30개까지 저장됩니다. 저장 뒤 내용을 바꾸면 다시 저장해야 완료 상태가 유지돼요.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={startNewApplication} className="min-h-10 border border-border px-3 text-xs font-semibold text-navy">새 지원서</button><button id="resume-pro-save-application" type="button" onClick={saveApplication} className="min-h-10 bg-navy px-3 text-xs font-semibold text-white">{currentApplicationSaved ? "현재 지원서 저장됨" : "현재 지원서 저장"}</button></div></div>{applications.length > 0 ? <ul className="mt-4 divide-y divide-border border-y border-border">{applications.map((application) => <li key={application.id} className="flex flex-wrap items-center gap-3 py-3"><button type="button" onClick={() => loadApplication(application)} className="min-h-10 flex-1 text-left"><strong className="block text-sm text-navy">{application.company}</strong><span className="mt-1 block text-xs text-muted">{application.role} · {application.updatedAt ? new Date(application.updatedAt).toLocaleDateString("en-AU") : "저장 시간 확인 필요"}{activeApplicationId === application.id ? currentApplicationSaved ? " · 저장됨" : " · 변경사항 있음" : ""}</span></button><button type="button" onClick={() => deleteApplication(application)} className="min-h-10 px-2 text-xs text-muted hover:text-red-700">삭제</button></li>)}</ul> : <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">저장한 지원서가 아직 없습니다. 회사명을 입력하고 현재 지원서 저장을 눌러 주세요.</p>}</section>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>회사명<input id="resume-pro-company" className={inputClass} value={draft.company} onChange={(event) => setField("company", event.target.value)} placeholder="Compass Cafe" /></label>
          <label className={labelClass}>지원 직무<input className={inputClass} value={draft.role} onChange={(event) => setField("role", event.target.value)} placeholder="Barista" /></label>
          <label className={`${labelClass} sm:col-span-2`}>담당자 이름 <span className="font-normal text-muted">(선택)</span><input className={inputClass} value={draft.hiringManager} onChange={(event) => setField("hiringManager", event.target.value)} placeholder="Hiring Manager" /></label>
        </div>
        <label className="mt-5 block text-sm font-medium text-navy">채용 공고<textarea id="resume-pro-job-ad" className={`${inputClass} min-h-48 resize-y`} value={draft.jobAd} onChange={(event) => setField("jobAd", event.target.value)} placeholder="채용 공고의 Responsibilities, Requirements 부분을 붙여 넣으세요." /></label>
        <section className="mt-6 border border-border bg-white p-4 sm:p-5" aria-labelledby="star-library-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Reusable experience</p>
              <h3 id="star-library-heading" className="mt-1 text-lg font-semibold text-navy">다음 지원에도 쓰는 STAR 경험</h3>
              <p className="mt-2 max-w-xl text-xs leading-5 text-muted">한 번 정리한 실제 경험을 회사가 달라도 다시 불러와 면접 답변과 Selection Criteria 준비에 활용하세요.</p>
            </div>
            <button type="button" onClick={startNewStarStory} disabled={starStories.length >= STAR_STORY_LIMIT} className="min-h-10 border border-border px-3 text-xs font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45">새 경험</button>
          </div>
          {starStories.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {starStories.map((story) => (
                <li key={story.id} className={`border p-3 ${draft.starStoryId === story.id ? "border-navy bg-navy/5" : "border-border"}`}>
                  <button type="button" onClick={() => applyStarStory(story)} className="min-h-10 w-full text-left">
                    <strong className="block text-sm text-navy">{story.title}</strong>
                    <span className="mt-1 block text-xs text-muted">{story.competency || "역량 미지정"}{draft.starStoryId === story.id ? " · 현재 지원서에 사용" : ""}</span>
                  </button>
                  <button type="button" onClick={() => deleteStarStory(story)} className="mt-1 min-h-9 text-xs text-muted hover:text-red-700">삭제</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>경험 이름<input className={inputClass} value={starStoryDraft.title} onChange={(event) => setStarField("title", event.target.value)} placeholder="바쁜 시간대 고객 불만 해결" /></label>
            <label className={labelClass}>보여준 역량 <span className="font-normal text-muted">(선택)</span><input className={inputClass} value={starStoryDraft.competency} onChange={(event) => setStarField("competency", event.target.value)} placeholder="Customer service" /></label>
            <label className={labelClass}>상황 (Situation)<textarea className={`${inputClass} min-h-24 resize-y`} value={starStoryDraft.situation} onChange={(event) => setStarField("situation", event.target.value)} placeholder="어떤 상황이었나요?" /></label>
            <label className={labelClass}>내 역할 (Task)<textarea className={`${inputClass} min-h-24 resize-y`} value={starStoryDraft.task} onChange={(event) => setStarField("task", event.target.value)} placeholder="내가 해결해야 했던 일은 무엇이었나요?" /></label>
            <label className={labelClass}>내가 한 행동 (Action)<textarea className={`${inputClass} min-h-28 resize-y`} value={starStoryDraft.action} onChange={(event) => setStarField("action", event.target.value)} placeholder="내가 직접 한 행동을 순서대로 적어보세요." /></label>
            <label className={labelClass}>결과 (Result)<textarea className={`${inputClass} min-h-28 resize-y`} value={starStoryDraft.result} onChange={(event) => setStarField("result", event.target.value)} placeholder="무엇이 달라졌고, 무엇을 배웠나요?" /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={saveStarStory} disabled={!editingStarStoryId && starStories.length >= STAR_STORY_LIMIT} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{editingStarStoryId ? "경험 업데이트" : "경험 저장하고 사용"}</button>
            <span className="text-xs leading-5 text-muted">현재 브라우저에 {starStories.length} / {STAR_STORY_LIMIT}개 저장 · 지원서 패키지에 함께 포함</span>
          </div>
        </section>
        <fieldset className="mt-6 border border-border bg-white p-4"><legend className="px-1 text-sm font-semibold text-navy">프리미엄 이력서 디자인</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{proLayouts.map((option) => <button key={option.id} type="button" onClick={() => setField("layout", option.id)} aria-pressed={draft.layout === option.id} className={`min-h-24 p-3 text-left ${draft.layout === option.id ? "bg-navy text-white" : "bg-surface text-navy"}`}><strong className="block text-sm">{option.name}</strong><span className={`mt-2 block text-xs leading-5 ${draft.layout === option.id ? "text-white/65" : "text-muted"}`}>{option.description}</span></button>)}</div><div className="mt-4 flex flex-wrap gap-2">{(Object.entries(proAccents) as Array<[ProAccent, (typeof proAccents)[ProAccent]]>).map(([id, option]) => <button key={id} type="button" onClick={() => setField("accent", id)} aria-pressed={draft.accent === id} className={`inline-flex min-h-11 items-center gap-2 border px-3 text-sm ${draft.accent === id ? "border-navy font-semibold" : "border-border"}`}><span className="h-4 w-4" style={{ backgroundColor: option.primary }} aria-hidden="true" />{option.name}</button>)}</div></fieldset>
        <fieldset className="mt-5"><legend className="text-sm font-medium text-navy">문장 분위기</legend><div className="mt-2 grid grid-cols-3 gap-2">{([['clear','명확하게'],['warm','친근하게'],['concise','간결하게']] as const).map(([id,label]) => <button key={id} type="button" onClick={() => setField("tone", id)} aria-pressed={draft.tone === id} className={`min-h-11 border px-2 py-2 text-sm ${draft.tone === id ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`}>{label}</button>)}</div></fieldset>
        <button id="resume-pro-cover-letter-action" type="button" onClick={createCoverLetter} className="mt-6 min-h-12 bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">커버레터 초안 만들기</button>
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
            <span className="text-xs leading-5 text-muted">TXT 파일 · 이력서 요약, 공고 점검, STAR 경험, 커버레터 포함</span>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">초안은 자동 저장되며 이 브라우저 밖으로 전송되지 않습니다. 최종 제출 전 회사명, 담당자, 경력과 자격을 직접 확인하세요.</p>
        </section>
      </div>
    </div>
    <section id="resume-pro-interview-prep" className="scroll-mt-24 border-t border-navy/20 pt-8" aria-labelledby="interview-prep-heading">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Interview &amp; selection criteria</p><h2 id="interview-prep-heading" className="mt-2 text-2xl font-semibold text-navy">공고에서 면접 질문까지 준비해요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">공고에서 자주 보이는 표현을 면접 질문으로 바꾸고, 내 경험을 떠올릴 수 있는 메모 칸을 함께 준비합니다.</p></div>
            <button type="button" onClick={createInterviewQuestions} className="min-h-12 bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">공고에서 질문 만들기</button>
          </div>
          {draft.interviewQuestions.length ? <ol className="mt-7 divide-y divide-border border-y border-border bg-white">{draft.interviewQuestions.map((question, index) => <li key={question.id} className="p-5 sm:p-6"><div className="flex items-start gap-4"><span className="font-mono text-sm text-gold">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="bg-gold/10 px-2.5 py-1 text-xs font-semibold text-[#755b20]">{question.focus}</span></div><h3 className="mt-3 text-base font-semibold leading-7 text-navy">{question.question}</h3><p className="mt-2 text-xs leading-5 text-muted">{question.prompt}</p><label className="mt-4 block text-xs font-semibold text-navy">내 답변 메모<textarea className={`${inputClass} min-h-28 resize-y font-normal leading-6`} value={draft.interviewAnswers[question.id] || ""} onChange={(event) => setInterviewAnswer(question.id, event.target.value)} placeholder="한국어로 먼저 핵심 경험을 적어도 괜찮아요. 최종 답변에 사용할 사실과 결과를 메모하세요." /></label></div></div></li>)}</ol> : <div className="mt-7 border border-dashed border-navy/25 bg-white p-6 text-sm leading-7 text-muted"><strong className="block text-navy">먼저 회사명, 직무와 채용 공고를 입력하세요.</strong>공고가 비어 있어도 기본 질문을 만들 수 있지만, Responsibilities와 Requirements를 붙여 넣으면 실제 공고에 가까운 질문이 나옵니다.</div>}
        </div>

        <aside className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="star-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">STAR answer builder</p>
          <h2 id="star-heading" className="mt-2 text-xl font-semibold text-navy">경험 하나를 STAR로 정리해요.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">위 보관함에서 경험을 고르면 같은 내용을 여기서 면접 답변으로 다듬을 수 있어요. 수정한 내용은 저장 버튼을 눌러 보관함에 업데이트하세요.</p>
          <label className="mt-5 block text-sm font-medium text-navy">경험 이름<input className={inputClass} value={starStoryDraft.title} onChange={(event) => setStarField("title", event.target.value)} placeholder="바쁜 시간대 고객 불만 해결" /></label>
          <label className="mt-4 block text-sm font-medium text-navy">보여줄 역량<input className={inputClass} value={starStoryDraft.competency} onChange={(event) => setStarField("competency", event.target.value)} placeholder={keywords[0] || "예: customer service"} /></label>
          <div className="mt-4 grid gap-4">
            {([
              ["situation", "S · 상황", "언제, 어디에서, 어떤 문제가 있었나요?"],
              ["task", "T · 맡은 일", "그 상황에서 내가 책임져야 했던 일은 무엇이었나요?"],
              ["action", "A · 행동", "내가 직접 판단하고 실행한 행동을 구체적으로 적어보세요."],
              ["result", "R · 결과", "시간·비용·고객 반응·오류 감소처럼 확인 가능한 변화가 있었나요?"],
            ] as const).map(([field, label, placeholder]) => <label key={field} className="block text-sm font-medium text-navy">{label}<textarea className={`${inputClass} min-h-24 resize-y font-normal leading-6`} value={starStoryDraft[field]} onChange={(event) => setStarField(field, event.target.value)} placeholder={placeholder} /></label>)}
          </div>
          <div className="mt-6 border-l-2 border-gold bg-surface p-4"><h3 className="text-sm font-semibold text-navy">영문 답변 뼈대</h3><pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-6 text-muted">{starAnswer || "네 칸 중 하나를 적으면 영어 STAR 구조로 정리됩니다."}</pre></div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button type="button" onClick={saveStarStory} disabled={!editingStarStoryId && starStories.length >= STAR_STORY_LIMIT} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{editingStarStoryId ? "보관함 경험 업데이트" : "보관함에 저장하고 연결"}</button>
            <button type="button" onClick={copyStarAnswer} disabled={!hasStarContent(starStoryDraft)} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-35">STAR 답변 복사</button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">{selectedStarStory ? `현재 ‘${selectedStarStory.title}’ 경험이 이 지원서에 연결되어 있습니다.` : "저장하면 이 경험이 현재 지원서와 보관함에 함께 연결됩니다."}</p>
          <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">면접 메모와 STAR 내용은 현재 브라우저에만 저장되며 외부 AI 서비스로 전송되지 않습니다. 지원서 패키지를 저장하면 이 내용도 함께 포함됩니다.</p>
        </aside>
      </div>
    </section>
    <section aria-labelledby="premium-resume-heading"><div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-navy/20 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Premium resume</p><h2 id="premium-resume-heading" className="mt-2 text-2xl font-semibold text-navy">선택한 디자인 미리보기</h2><p className="mt-2 text-sm leading-6 text-muted">무료 빌더의 최신 내용을 사용합니다. 내용 수정은 무료 빌더에서 한 뒤 ‘이력서 다시 불러오기’를 눌러 주세요.</p></div><button type="button" onClick={() => window.print()} className="min-h-12 bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">이 디자인으로 PDF 저장</button></div><div className="mx-auto max-w-[850px]"><ResumeProDocument resume={savedResume} layout={draft.layout} accent={draft.accent} /></div></section>
    </div>
  );
}
