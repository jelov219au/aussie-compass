"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "idea" | "drafting" | "ready" | "published";
type Entry = { id: string; topicId: string; title: string; path: string; date: string; channel: string; format: string; campaign: string; status: Status; hook: string; caption: string; hashtags: string; createdAt: string };

const STORAGE_KEY = "hoju-compass-content-planner-v1";
const topics = [
  { id: "arrival", stage: "도착", title: "호주 도착 첫 30일 순서", path: "/arrival-checklist", campaign: "first-30-days" },
  { id: "arrival-english", stage: "도착", title: "영어가 막힐 때 바로 쓰는 확인 문장", path: "/resources/australia-arrival-english-clarifying-phrases", campaign: "arrival-english-phrases" },
  { id: "english-bank", stage: "생활 영어", title: "은행에서 수수료를 확인하는 영어 문장", path: "/english-phrase-cards", campaign: "english-phrase-bank" },
  { id: "english-rent", stage: "생활 영어", title: "렌트 계약 전에 확인하는 영어 문장", path: "/english-phrase-cards", campaign: "english-phrase-rent" },
  { id: "english-work", stage: "생활 영어", title: "첫 직장에서 시급을 확인하는 영어 문장", path: "/english-phrase-cards", campaign: "english-phrase-work" },
  { id: "english-health", stage: "생활 영어", title: "병원에서 통역을 요청하는 영어 문장", path: "/english-phrase-cards", campaign: "english-phrase-health" },
  { id: "sim", stage: "도착", title: "호주 첫 SIM·eSIM 안전하게 개통하기", path: "/resources/australia-sim-esim-setup-guide", campaign: "first-australian-sim" },
  { id: "bank", stage: "도착", title: "호주 첫 은행 계좌 안전하게 열기", path: "/resources/australia-bank-account-opening-guide", campaign: "first-bank-account" },
  { id: "health", stage: "도착", title: "처음 아플 때 GP·병원·약국 이용 순서", path: "/resources/australia-gp-hospital-pharmacy-guide", campaign: "first-healthcare-visit" },
  { id: "payslip", stage: "일", title: "첫 Payslip에서 확인할 5가지", path: "/payslip-guide", campaign: "first-payslip" },
  { id: "public-holiday-pay", stage: "일", title: "공휴일 근무수당 확인 순서", path: "/resources/australia-public-holiday-work-pay-guide", campaign: "public-holiday-pay" },
  { id: "resume", stage: "구직", title: "호주식 영문 이력서 시작하기", path: "/resume-builder", campaign: "resume-starter" },
  { id: "resume-template", stage: "구직", title: "호주 이력서 양식·제출 전 점검", path: "/resources/australia-resume-template-submission-checklist", campaign: "resume-template-free-pdf" },
  { id: "resume-job-ad-check", stage: "구직", title: "이력서·Job Ad 공고 맞춤 근거 점검", path: "/resume-job-ad-checker", campaign: "resume-job-ad-evidence-check" },
  { id: "cover-letter", stage: "구직", title: "호주 커버레터 제출 전 점검", path: "/resources/australia-cover-letter-job-ad-checklist", campaign: "cover-letter-job-ad-checklist" },
  { id: "rent", stage: "집", title: "쉐어하우스 방문 체크리스트", path: "/property-inspection-checklist", campaign: "rental-check" },
  { id: "transport", stage: "이동", title: "차 없이 통학·출근 생활권 고르기", path: "/public-transport-guide", campaign: "commute-planning" },
  { id: "salary", stage: "돈", title: "시급·세후 급여·Super 함께 보기", path: "/salary-calculator", campaign: "salary-check" },
  { id: "tax", stage: "정기", title: "EOFY 전에 모아야 할 자료", path: "/tax-return-guide", campaign: "eofy-ready" },
  { id: "underpayment", stage: "일", title: "급여가 예상보다 적을 때 확인 순서", path: "/underpayment-guide", campaign: "pay-check" },
  { id: "leaving", stage: "귀국", title: "귀국 전후 놓치기 쉬운 정산", path: "/leaving-australia-guide", campaign: "leaving-australia" },
  { id: "pro", stage: "Pro", title: "상황별 Hoju Compass Pro 비교", path: "/pro", campaign: "pro-tools" },
] as const;
const channels = [["instagram", "Instagram"], ["youtube", "YouTube"], ["naver", "Naver Blog·Cafe"], ["facebook", "Facebook"], ["kakao", "Kakao"], ["newsletter", "Newsletter"]] as const;
const formats = [["card", "카드뉴스"], ["reel", "Reel·Shorts"], ["post", "긴 글"], ["story", "Story"], ["email", "이메일"]] as const;
const statusLabels: Record<Status, string> = { idea: "아이디어", drafting: "제작 중", ready: "발행 준비", published: "발행 완료" };
const englishPhrasePublishingPack = [
  {
    topicId: "english-rent",
    hook: "집이 마음에 들어도 돈부터 보내지는 마세요.",
    caption: `집이 마음에 들어도 돈부터 보내지는 마세요.

계약 상대와 집 주소를 확인하고, 계약서를 먼저 받아 읽어보는 게 좋아요. Bond와 렌트비에 포함되는 비용도 말로만 듣지 말고 글로 남겨두세요.

이럴 때 이렇게 물어볼 수 있어요.
“Could you send me the agreement before I pay?”
돈을 보내기 전에 계약서를 보내주실 수 있나요?

필요할 때 바로 꺼내 쓸 수 있도록 저장해 두세요. 프로필 링크에서 렌트할 때 쓰는 문장을 더 볼 수 있어요.`,
    hashtags: "#호주렌트 #호주쉐어하우스 #호주생활영어 #호주워홀준비 #호주유학생활 #HojuCompass",
  },
  {
    topicId: "english-work",
    hook: "첫 출근 전에 시급을 글로 받아두세요.",
    caption: `첫 출근 전에 시급을 글로 받아두세요.

시급만 묻고 끝내지 말고 내 Classification과 고용 형태도 같이 확인하는 게 좋아요. 나중에 Payslip을 볼 때 비교할 기준이 됩니다.

이럴 때 이렇게 물어볼 수 있어요.
“Could you confirm my hourly rate in writing?”
제 시급을 글로 확인해 주실 수 있나요?

말로 들은 조건은 메시지나 이메일로 한 번 더 확인해 두세요. 프로필 링크에서 직장에서 쓰는 문장을 더 볼 수 있어요.`,
    hashtags: "#호주직장 #호주시급 #호주급여 #호주생활영어 #호주워홀 #HojuCompass",
  },
  {
    topicId: "english-bank",
    hook: "계좌를 열기 전에 수수료 조건부터 확인하세요.",
    caption: `계좌를 열기 전에 수수료 조건부터 확인하세요.

월 관리비뿐 아니라 ATM과 해외 결제 수수료도 함께 물어보는 게 좋아요. 무료라고 들었다면 어떤 조건에서 무료인지도 확인해 두세요.

이럴 때 이렇게 물어볼 수 있어요.
“Are there any monthly or ATM fees?”
월 관리비나 ATM 수수료가 있나요?

비용과 조건은 화면이나 안내문으로 다시 확인해 두세요. 프로필 링크에서 은행에서 쓰는 문장을 더 볼 수 있어요.`,
    hashtags: "#호주은행 #호주계좌개설 #호주생활영어 #호주워홀준비 #호주생활팁 #HojuCompass",
  },
  {
    topicId: "english-health",
    hook: "병원에서 말이 막히면 통역이 필요하다고 먼저 말하세요.",
    caption: `병원에서 말이 막히면 통역이 필요하다고 먼저 말하세요.

진료, 검사, 동의서와 약 복용처럼 중요한 내용을 이해하지 못했다면 그냥 넘기지 않아도 됩니다. 한국어 통역이 필요한지 분명하게 말하고, 이해될 때까지 다시 물어보세요.

이럴 때 이렇게 말할 수 있어요.
“I need a Korean interpreter, please.”
한국어 통역이 필요합니다.

필요할 때 바로 보여줄 수 있도록 이 문장을 저장해 두세요. 프로필 링크에서 병원에서 쓰는 문장을 더 볼 수 있어요.`,
    hashtags: "#호주병원 #호주생활영어 #호주워홀 #호주유학 #호주생활 #HojuCompass",
  },
] as const;

const coverLetterPublishingPack = [
  {
    channel: "instagram",
    format: "card",
    hook: "호주 커버레터, 첫 문장보다 먼저 볼 게 있습니다.",
    caption: `호주 커버레터, 첫 문장보다 먼저 볼 게 있습니다.

먼저 Job ad가 cover letter를 요구하는지, 별도 질문이나 글자 수가 있는지 확인하세요. 그다음 공고의 표현을 내가 실제로 해본 경험에만 연결해야 합니다.

제출 전에는 담당자·회사명·직무명, 한 페이지 분량, 사실 여부와 PDF·DOCX 형식을 다시 확인하세요.

문장을 대신 만들어 주는 자료가 아니라, 공고 지시와 내 사실을 빠뜨리지 않게 확인하는 무료 체크리스트를 준비했습니다. 프로필 링크에서 확인하세요.`,
    hashtags: "#호주커버레터 #호주이력서 #호주취업 #호주워홀 #호주유학 #CoverLetter #HojuCompass",
  },
  {
    channel: "naver",
    format: "post",
    hook: "커버레터를 무조건 쓰기 전에 공고 지시부터 확인하세요.",
    caption: `호주 구직에서 cover letter를 준비할 때 가장 먼저 볼 것은 예쁜 첫 문장이 아니라 해당 Job ad의 제출 지시입니다.

공고가 커버레터를 요구하는지, resume 외에 selection criteria나 별도 질문이 있는지, 파일 형식과 분량은 무엇인지부터 적어두세요. 공고의 키워드는 내가 실제로 가진 기술과 경험에만 사용하고, 확인할 수 없는 수치·자격·성과는 넣지 않습니다.

Hoju Compass의 무료 체크리스트에는 수신자, 직무명, 3~4개 문단·한 페이지 구성, 사실·맞춤법·파일 형식 확인 순서를 모았습니다. 실제 공고를 옆에 두고 제출 전에 한 번씩 체크해 보세요.`,
    hashtags: "#호주취업 #호주커버레터 #영문이력서 #호주워홀준비 #호주유학생활 #HojuCompass",
  },
  {
    channel: "youtube",
    format: "reel",
    hook: "커버레터 제출 전 10초: 회사명, 직무명, 실제 경험.",
    caption: `커버레터 제출 버튼을 누르기 전 세 가지만 먼저 보세요.

1. 이전 지원서의 회사명이나 직무명이 남아 있지 않은가
2. 공고 표현을 실제로 해본 경험에만 연결했는가
3. 공고가 요구한 분량과 파일 형식이 맞는가

전체 제출 전 점검표는 Hoju Compass 무료 커버레터 가이드에서 확인할 수 있어요.`,
    hashtags: "#호주취업 #CoverLetter #호주이력서 #취업준비 #HojuCompass",
  },
] as const;

const resumeTemplatePublishingPack = [
  {
    channel: "naver",
    format: "post",
    hook: "호주 이력서 양식, 예쁜 디자인보다 읽히는 순서가 먼저입니다.",
    caption: `호주 이력서를 처음 만들 때는 장식보다 이름·연락처, 관련 기술, 최근 경력, 학력·자격이 빠르게 읽히는 순서가 중요합니다.

무료 Resume Builder에서 실제 경력 한 건부터 입력하고 PDF로 저장한 뒤 파일을 다시 열어 연락처, 줄바꿈과 두 번째 페이지를 확인하세요. 지원할 공고가 생기면 그 공고의 키워드를 내가 실제로 가진 경험에만 연결합니다.

공식 Workforce Australia 기준으로 정리한 무료 양식과 제출 전 체크리스트를 Hoju Compass에서 바로 사용할 수 있어요.`,
    hashtags: "#호주이력서 #호주이력서양식 #영문이력서 #호주취업 #호주워홀준비 #ResumeTemplate #HojuCompass",
  },
  {
    channel: "instagram",
    format: "card",
    hook: "호주 이력서 제출 전, 이 5가지만 다시 보세요.",
    caption: `호주 이력서 제출 전 5가지:

1. 이름·전화·이메일이 첫 페이지에 정확한가
2. 최근 경력부터 역순으로 정리했는가
3. 공고 키워드를 실제 경험에만 사용했는가
4. 모든 날짜·자격·수치가 사실인가
5. PDF를 다시 열었을 때 글자가 잘리지 않는가

무료 Builder와 전체 체크리스트는 프로필 링크에서 확인하세요. 입력 내용은 현재 브라우저에 저장됩니다.`,
    hashtags: "#호주취업 #호주이력서 #영문이력서양식 #호주워홀 #취업준비 #HojuCompass",
  },
  {
    channel: "youtube",
    format: "reel",
    hook: "이력서에 넣지 말아야 할 것: TFN, 여권번호, 만든 성과.",
    caption: `호주 이력서에는 TFN, 여권번호, 은행정보와 전체 집 주소를 넣지 마세요.

추천인 연락처는 먼저 허락을 받고, AI가 만든 숫자·직책·자격은 모두 지워야 합니다. 경력이 적다면 실제 봉사·프로젝트 경험을 범위에 맞게 적으세요.

무료 이력서 양식과 제출 전 점검표는 Hoju Compass에서 확인할 수 있어요.`,
    hashtags: "#호주이력서 #ResumeTips #호주취업 #개인정보보호 #호주생활 #HojuCompass",
  },
] as const;

const resumeJobAdPublishingPack = [
  {
    channel: "naver",
    format: "post",
    hook: "호주 Job Ad 키워드, 이력서에 그대로 복사하면 안 되는 이유",
    caption: `호주 채용 공고에서 반복되는 키워드를 찾는 것보다 먼저 할 일이 있습니다.

그 표현을 내가 실제로 언제, 어떻게 사용했는지 설명할 수 있는지 확인해야 합니다. 이력서에 같은 문구가 없다고 바로 추가하면 면접에서 근거를 설명하지 못하거나 사실과 다른 내용이 될 수 있어요.

Hoju Compass의 무료 공고 맞춤 근거 점검기는 이력서와 Job Ad를 현재 화면에서만 비교합니다. 점수나 합격 가능성을 만들지 않고, 같은 문구와 실제 경험을 더 확인할 항목을 구분해 보여줘요.`,
    hashtags: "#호주이력서 #호주취업 #JobAd #영문이력서 #ATS이력서 #호주워홀준비 #HojuCompass",
  },
  {
    channel: "instagram",
    format: "card",
    hook: "공고 키워드가 이력서에 없을 때: 추가 말고 근거 확인.",
    caption: `Job Ad 표현이 내 이력서에서 보이지 않을 때 세 단계:

1. 내가 실제로 해본 일인가
2. 언제, 어떤 행동과 결과가 있었나
3. 면접에서 같은 사실을 설명할 수 있나

세 질문에 답할 수 있을 때만 내 말로 이력서에 연결하세요. 공고 문구를 복사하거나 AI로 경험을 만들지 않습니다.

무료 로컬 비교 도구는 프로필 링크에서 사용할 수 있어요.`,
    hashtags: "#호주취업 #호주이력서 #ResumeTips #JobApplication #호주워홀 #HojuCompass",
  },
  {
    channel: "youtube",
    format: "reel",
    hook: "ATS 점수보다 중요한 10초 질문: 이 경험을 면접에서 설명할 수 있나요?",
    caption: `공고와 이력서를 비교하는 도구가 80점을 보여줘도 채용을 보장하지 않습니다.

같은 키워드가 있는지 확인한 뒤, 실제 상황·내 행동·결과를 설명할 수 있는지 먼저 물어보세요. 근거가 없다면 추가하지 않는 것이 맞습니다.

Hoju Compass의 무료 점검기는 텍스트를 서버로 보내거나 저장하지 않아요.`,
    hashtags: "#ATS이력서 #호주취업 #영문이력서 #면접준비 #ResumeChecker #HojuCompass",
  },
] as const;

function cleanTag(value: string) { return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, "-").replace(/[^a-z0-9가-힣_-]/g, "").replace(/-+/g, "-").slice(0, 64); }
function dateOffset(offset: number) { const date = new Date(); date.setDate(date.getDate() + offset); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function displayDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date(`${value}T12:00:00`)); }
function icsEscape(value: string) { return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); }

function safeEntries(value: unknown): Entry[] {
  if (!Array.isArray(value)) return [];
  const topicPaths = new Set(topics.map((topic) => topic.path));
  const channelIds = new Set(channels.map(([id]) => id));
  const formatIds = new Set(formats.map(([id]) => id));
  const statuses = new Set<Status>(["idea", "drafting", "ready", "published"]);
  return value.filter((item): item is Entry => Boolean(item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string" && typeof item.path === "string" && topicPaths.has(item.path as typeof topics[number]["path"]) && typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && typeof item.channel === "string" && channelIds.has(item.channel as typeof channels[number][0]) && typeof item.format === "string" && formatIds.has(item.format as typeof formats[number][0]) && typeof item.status === "string" && statuses.has(item.status as Status))).slice(0, 60).map((item) => ({ ...item, title: item.title.slice(0, 80), campaign: cleanTag(item.campaign || "content"), hook: typeof item.hook === "string" ? item.hook.slice(0, 140) : "", caption: typeof item.caption === "string" ? item.caption.slice(0, 1600) : "", hashtags: typeof item.hashtags === "string" ? item.hashtags.slice(0, 300) : "" }));
}

export function ContentPublishingPlanner() {
  const [topicId, setTopicId] = useState<string>(topics[0].id);
  const [date, setDate] = useState("");
  const [channel, setChannel] = useState<string>("instagram");
  const [format, setFormat] = useState<string>("card");
  const [campaign, setCampaign] = useState<string>(topics[0].campaign);
  const [hook, setHook] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [copiedEntryId, setCopiedEntryId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const topic = topics.find((item) => item.id === topicId) ?? topics[0];

  useEffect(() => {
    setDate(dateOffset(1));
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setEntries(safeEntries(JSON.parse(stored))); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 60))); } catch {} }, [entries, loaded]);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)), [entries]);
  const counts = useMemo(() => ({ total: entries.length, ready: entries.filter((item) => item.status === "ready").length, published: entries.filter((item) => item.status === "published").length }), [entries]);
  const changeTopic = (id: string) => { const next = topics.find((item) => item.id === id) ?? topics[0]; setTopicId(next.id); setCampaign(next.campaign); };
  const addEntry = () => {
    if (!date || !cleanTag(campaign)) { setMessage("발행일과 캠페인 이름을 확인해 주세요."); return; }
    const item: Entry = { id: crypto.randomUUID(), topicId: topic.id, title: topic.title, path: topic.path, date, channel, format, campaign: cleanTag(campaign), status: "idea", hook: hook.trim().slice(0, 140), caption: "", hashtags: "", createdAt: new Date().toISOString() };
    setEntries((current) => [...current, item].slice(-60)); setHook(""); setDate(dateOffset(2)); setMessage("발행 계획에 추가했습니다.");
  };
  const loadSampleWeek = () => {
    const sampleIds = ["arrival", "bank", "health", "public-holiday-pay", "resume"];
    const samples = sampleIds.map((id) => topics.find((item) => item.id === id) ?? topics[0]).map((item, index): Entry => ({ id: crypto.randomUUID(), topicId: item.id, title: item.title, path: item.path, date: dateOffset(index + 1), channel: index % 2 ? "naver" : "instagram", format: index % 2 ? "post" : "card", campaign: item.campaign, status: "idea", hook: "", caption: "", hashtags: "", createdAt: new Date().toISOString() }));
    setEntries((current) => current.length ? current : samples); setMessage(entries.length ? "기존 계획이 있어 샘플을 추가하지 않았습니다." : "5일 샘플 발행 계획을 불러왔습니다.");
  };
  const loadEnglishPhraseCampaign = () => {
    const missing = englishPhrasePublishingPack.filter((pack) => {
      const item = topics.find((topic) => topic.id === pack.topicId);
      return item && !entries.some((entry) => entry.campaign === item.campaign);
    });
    const campaignEntries = missing.map((pack, index): Entry => {
      const item = topics.find((topic) => topic.id === pack.topicId) ?? topics[0];
      return { id: crypto.randomUUID(), topicId: item.id, title: item.title, path: item.path, date: dateOffset(index + 1), channel: "instagram", format: "card", campaign: item.campaign, status: "ready", hook: pack.hook, caption: pack.caption, hashtags: pack.hashtags, createdAt: new Date().toISOString() };
    });
    setEntries((current) => {
      const updated = current.map((entry) => {
        const pack = englishPhrasePublishingPack.find((item) => topics.find((topic) => topic.id === item.topicId)?.campaign === entry.campaign);
        return pack ? { ...entry, hook: pack.hook, caption: pack.caption, hashtags: pack.hashtags, status: entry.status === "published" ? entry.status : "ready" as Status } : entry;
      });
      return [...updated, ...campaignEntries].slice(-60);
    });
    setMessage(campaignEntries.length ? `생활 영어 4일 발행팩을 추가했습니다. ${campaignEntries.length}개 게시물이 바로 발행 가능한 상태예요.` : "기존 생활 영어 일정에 캡션과 해시태그를 채웠습니다.");
  };
  const loadCoverLetterCampaign = () => {
    if (entries.some((entry) => entry.topicId === "cover-letter")) {
      setMessage("커버레터 캠페인이 이미 발행 일정에 있습니다.");
      return;
    }
    const item = topics.find((topic) => topic.id === "cover-letter") ?? topics[0];
    const campaignEntries = coverLetterPublishingPack.map((pack, index): Entry => ({
      id: crypto.randomUUID(), topicId: item.id, title: item.title, path: item.path, date: dateOffset(index + 1),
      channel: pack.channel, format: pack.format, campaign: item.campaign, status: "ready", hook: pack.hook,
      caption: pack.caption, hashtags: pack.hashtags, createdAt: new Date().toISOString(),
    }));
    setEntries((current) => [...current, ...campaignEntries].slice(-60));
    setMessage("커버레터 3일 발행팩을 추가했습니다. 세 게시물이 바로 발행 가능한 상태예요.");
  };
  const loadResumeTemplateCampaign = () => {
    if (entries.some((entry) => entry.topicId === "resume-template")) {
      setMessage("이력서 양식 캠페인이 이미 발행 일정에 있습니다.");
      return;
    }
    const item = topics.find((topic) => topic.id === "resume-template") ?? topics[0];
    const campaignEntries = resumeTemplatePublishingPack.map((pack, index): Entry => ({
      id: crypto.randomUUID(), topicId: item.id, title: item.title, path: item.path, date: dateOffset(index + 1),
      channel: pack.channel, format: pack.format, campaign: item.campaign, status: "ready", hook: pack.hook,
      caption: pack.caption, hashtags: pack.hashtags, createdAt: new Date().toISOString(),
    }));
    setEntries((current) => [...current, ...campaignEntries].slice(-60));
    setMessage("이력서 양식 3일 발행팩을 추가했습니다. 세 게시물이 바로 발행 가능한 상태예요.");
  };
  const loadResumeJobAdCampaign = () => {
    if (entries.some((entry) => entry.topicId === "resume-job-ad-check")) {
      setMessage("공고 맞춤 점검 캠페인이 이미 발행 일정에 있습니다.");
      return;
    }
    const item = topics.find((topic) => topic.id === "resume-job-ad-check") ?? topics[0];
    const campaignEntries = resumeJobAdPublishingPack.map((pack, index): Entry => ({
      id: crypto.randomUUID(), topicId: item.id, title: item.title, path: item.path, date: dateOffset(index + 1),
      channel: pack.channel, format: pack.format, campaign: item.campaign, status: "ready", hook: pack.hook,
      caption: pack.caption, hashtags: pack.hashtags, createdAt: new Date().toISOString(),
    }));
    setEntries((current) => [...current, ...campaignEntries].slice(-60));
    setMessage("공고 맞춤 점검 3일 발행팩을 추가했습니다. 세 게시물이 바로 발행 가능한 상태예요.");
  };
  const copyPublishingText = async (item: Entry) => {
    try { await navigator.clipboard.writeText([item.caption, item.hashtags].filter(Boolean).join("\n\n")); setCopiedEntryId(item.id); }
    catch { setMessage("자동 복사가 되지 않았어요. 게시 문구를 직접 선택해 복사해 주세요."); }
  };
  const updateStatus = (id: string, status: Status) => setEntries((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  const downloadCalendar = () => {
    if (!entries.length) return;
    const events = sorted.map((item) => ["BEGIN:VEVENT", `UID:content-${item.id}@hojucompass.com`, `DTSTART;VALUE=DATE:${item.date.replace(/-/g, "")}`, `SUMMARY:${icsEscape(`[${channels.find(([id]) => id === item.channel)?.[1] ?? item.channel}] ${item.title}`)}`, `DESCRIPTION:${icsEscape(`${formats.find(([id]) => id === item.format)?.[1] ?? item.format} · ${statusLabels[item.status]}\nHoju Compass 콘텐츠 발행 준비`)}`, `URL:https://hojucompass.com/content-planner`, "END:VEVENT"].join("\r\n"));
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hoju Compass//Content Planner//KO", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "hoju-compass-content-plan.ics"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
    <section className="min-w-0 border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="content-entry-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Plan one useful post</p><h2 id="content-entry-heading" className="mt-2 text-2xl font-semibold text-navy">다음 게시물 정하기</h2><p className="mt-3 text-sm leading-6 text-muted">사람이 실제로 다음 행동을 할 수 있는 Hoju Compass 페이지 한 곳을 연결합니다.</p>
      <div className="mt-6 space-y-4"><label className="block text-sm font-medium text-navy">주제<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3" value={topicId} onChange={(event) => changeTopic(event.target.value)}>{topics.map((item) => <option key={item.id} value={item.id}>{item.stage} · {item.title}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-sm font-medium text-navy">발행일<input type="date" className="mt-1.5 min-h-11 w-full border border-border px-3" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="text-sm font-medium text-navy">채널<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3" value={channel} onChange={(event) => setChannel(event.target.value)}>{channels.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="text-sm font-medium text-navy">형식<select className="mt-1.5 min-h-11 w-full border border-border bg-white px-3" value={format} onChange={(event) => setFormat(event.target.value)}>{formats.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label className="text-sm font-medium text-navy">캠페인 이름<input className="mt-1.5 min-h-11 w-full border border-border px-3" value={campaign} onChange={(event) => setCampaign(event.target.value)} /></label></div><label className="block text-sm font-medium text-navy">첫 문장 메모 <span className="font-normal text-muted">선택</span><textarea rows={3} maxLength={140} className="mt-1.5 w-full resize-y border border-border p-3 text-sm" value={hook} onChange={(event) => setHook(event.target.value)} placeholder="예: 첫 Payslip, 입금액만 보면 놓치는 게 있습니다." /></label></div>
      <button type="button" onClick={addEntry} className="mt-5 min-h-12 w-full bg-navy px-4 text-sm font-semibold text-white">발행 계획에 추가</button><button type="button" onClick={loadResumeJobAdCampaign} className="mt-2 min-h-11 w-full border border-gold bg-gold/10 px-4 text-sm font-semibold text-navy">공고 맞춤 점검 3일 발행팩 불러오기</button><button type="button" onClick={loadResumeTemplateCampaign} className="mt-2 min-h-11 w-full border border-gold bg-gold/10 px-4 text-sm font-semibold text-navy">이력서 양식 3일 발행팩 불러오기</button><button type="button" onClick={loadCoverLetterCampaign} className="mt-2 min-h-11 w-full border border-gold bg-gold/10 px-4 text-sm font-semibold text-navy">커버레터 3일 발행팩 불러오기</button><button type="button" onClick={loadEnglishPhraseCampaign} className="mt-2 min-h-11 w-full border border-gold bg-gold/10 px-4 text-sm font-semibold text-navy">생활 영어 4일 발행팩 불러오기</button><button type="button" onClick={loadSampleWeek} className="mt-2 min-h-11 w-full border border-border px-4 text-sm font-semibold text-navy">5일 샘플 불러오기</button><p className="mt-3 min-h-5 text-xs leading-5 text-muted" aria-live="polite">{message}</p>
    </section>

    <section className="min-w-0" aria-labelledby="publishing-plan-heading">
      <div className="grid gap-3 border-y border-navy/20 py-5 sm:grid-cols-3"><div><span className="font-mono text-xs text-gold">TOTAL</span><strong className="mt-1 block text-2xl text-navy">{counts.total}</strong><span className="text-xs text-muted">전체 계획</span></div><div><span className="font-mono text-xs text-gold">READY</span><strong className="mt-1 block text-2xl text-navy">{counts.ready}</strong><span className="text-xs text-muted">발행 준비</span></div><div><span className="font-mono text-xs text-gold">DONE</span><strong className="mt-1 block text-2xl text-navy">{counts.published}</strong><span className="text-xs text-muted">발행 완료</span></div></div>
      <div className="flex flex-wrap items-end justify-between gap-4 py-6"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Local publishing desk</p><h2 id="publishing-plan-heading" className="mt-2 text-2xl font-semibold text-navy">발행 일정</h2></div>{entries.length ? <div className="flex gap-4"><button type="button" onClick={downloadCalendar} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy">캘린더 저장</button><button type="button" onClick={() => setEntries([])} className="min-h-11 text-sm text-muted hover:text-red-700">전체 삭제</button></div> : null}</div>
      {sorted.length ? <ol className="divide-y divide-border border-y border-navy/20">{sorted.map((item, index) => <li key={item.id} className="py-5"><div className="flex min-w-0 gap-3"><span className="mt-1 font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{displayDate(item.date)} · {channels.find(([id]) => id === item.channel)?.[1]} · {formats.find(([id]) => id === item.format)?.[1]}</p><h3 className="mt-1 text-lg font-semibold text-navy">{item.title}</h3></div><select aria-label={`${item.title} 상태`} value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as Status)} className="min-h-10 border border-border bg-white px-2 text-xs font-semibold text-navy">{Object.entries(statusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>{item.hook ? <p className="mt-3 border-l-2 border-gold pl-3 text-sm leading-6 text-muted">{item.hook}</p> : null}{item.caption ? <details className="mt-4 border border-border bg-surface p-4"><summary className="cursor-pointer text-sm font-semibold text-navy">게시 문구와 해시태그 보기</summary><p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">{item.caption}</p><p className="mt-4 text-sm leading-7 text-navy">{item.hashtags}</p><button type="button" onClick={() => void copyPublishingText(item)} className="mt-4 min-h-10 border-b border-gold text-xs font-semibold text-navy">{copiedEntryId === item.id ? "복사됨" : "게시 문구 복사"}</button></details> : null}<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2"><Link href={{ pathname: "/campaign-link-builder", query: { target: item.path, source: item.channel, campaign: item.campaign, content: `${item.format}-${item.date}` } }} className="inline-flex min-h-10 items-center border-b border-gold text-xs font-semibold text-navy">링크·카드 준비 →</Link><Link href={{ pathname: "/content-performance", query: { target: item.path, source: item.channel, campaign: item.campaign, date: item.date, format: item.format } }} className="inline-flex min-h-10 items-center text-xs font-semibold text-navy">발행 후 성과 기록 →</Link><Link href={item.path} className="inline-flex min-h-10 items-center text-xs font-medium text-muted">원문 확인</Link><button type="button" onClick={() => setEntries((current) => current.filter((entry) => entry.id !== item.id))} className="min-h-10 text-xs text-muted hover:text-red-700">삭제</button></div></div></div></li>)}</ol> : <div className="border-y border-border py-12 text-center"><p className="font-semibold text-navy">아직 발행 계획이 없습니다.</p><p className="mt-2 text-sm text-muted">왼쪽에서 한 건을 추가하거나 생활 영어 발행팩을 불러오세요.</p></div>}
      <p className="mt-5 text-xs leading-5 text-muted">계획은 현재 브라우저에만 저장됩니다. 자동 게시, 계정 연결, 방문자 추적은 하지 않습니다.</p>
    </section>
  </div>;
}
