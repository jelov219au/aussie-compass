import { readLocalRecord, recordNeedsReview, localRecordIssue, type LocalRecordState } from "@/lib/localRecordState";
import { localProjectMetadata } from "@/lib/localProjectMetadata";
import { projectCodec } from "@/lib/localProjectChecklist";
import { parsePersonalPlan, personalPlanKey, savedPlanHref } from "@/lib/personalRoutePlan";
import { parseTaxRecords, taxPrepRecordsStorageKey, financialYearStart, financialYearLabel, recordTotals } from "@/lib/taxPrepStorage";
import { parseTaxChecklist, taxChecklistStorageKey, taxChecklistIds } from "@/lib/taxReturnChecklist";
import { parseApplications, jobStorageKey } from "@/lib/jobApplications";
import { parseSavings, parseBudget } from "@/lib/personalPlans";
import { parseResumeBuilderDraft, resumeEssentialCount, resumePlainText } from "@/lib/resumeBuilderData";
import { parseSavedSalary } from "@/lib/salaryCalculationState";
import { parseReminders } from "@/lib/lifeReminders";
import { parseWatchAreas } from "@/lib/railWorkWatch";
import { RAIL_WORK_ALERT_STORAGE_KEY } from "@/lib/railWorkAlerts";
import { parseBookmarks, bookmarkKey } from "@/lib/bookmarks";
import { parseArticleHistory, ARTICLE_READ_HISTORY_KEY } from "@/lib/articleProgress";

export type DashboardItem = { href: string; eyebrow: string; title: string; detail: string; progress?: number; active: boolean; action: string; status: LocalRecordState<unknown>["status"] };
type Base = Pick<DashboardItem, "href" | "eyebrow" | "title">;
type Description = { detail: string; active: boolean; progress?: number };
export function readCompassRecords(getStorage: () => Pick<Storage, "getItem"> = () => localStorage, now = new Date()) {
  const item = <T,>(key: string, base: Base, parse: (raw: string) => T | null, describe: (value: T) => Description): DashboardItem => {
    const result = readLocalRecord(key, parse, getStorage);
    if (recordNeedsReview(result)) return { ...base, detail: localRecordIssue(result), active: false, action: "기록 확인", status: result.status };
    const description = result.status === "valid" ? describe(result.value) : { detail: "아직 시작하지 않았습니다.", active: false };
    return { ...base, ...description, status: result.status, action: description.active ? "계속하기" : "시작하기" };
  };
  const items: DashboardItem[] = localProjectMetadata.map(project => item(project.key, project,
    projectCodec(project.ids.map(id => ({ id, label: "", detail: "" }))).parse,
    data => ({ active: data.checked.length > 0 || !!data.targetDate, detail: `${data.checked.length}/${project.ids.length}개 직접 체크${data.targetDate ? ` · 목표일 ${data.targetDate}` : ""}`, progress: Math.round(data.checked.length / project.ids.length * 100) })));
  items.unshift(item(personalPlanKey, { href: savedPlanHref, eyebrow: "맞춤 경로", title: "저장한 맞춤 계획" }, parsePersonalPlan, plan => {
    const next = plan.steps.find(step => !plan.completed.includes(step.href));
    return { active: true, detail: `${plan.completed.length}/${plan.steps.length}개 직접 완료 표시${next ? ` · 다음: ${next.title}` : " · 모두 표시됨"}`, progress: Math.round(plan.completed.length / plan.steps.length * 100) };
  }));
  const currentYear = financialYearStart(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`);
  items.push(item(taxPrepRecordsStorageKey, { href: "/tax-prep-tracker", eyebrow: "연중 세금 준비", title: "택스 리턴 준비 장부" }, parseTaxRecords, records => {
    const current = records.filter(record => financialYearStart(record.date) === currentYear), totals = recordTotals(current)!;
    return { active: records.length > 0, detail: `${financialYearLabel(currentYear)} FY · ${current.length}건 · 기록 있는 달 ${totals.months}개 · 미확인 증빙 ${totals.missing}건${records.length > current.length ? ` · 다른 FY ${records.length-current.length}건도 보관 중` : ""}. 기록 수는 신고 준비 완료도가 아닙니다.` };
  }));
  items.push(item(taxChecklistStorageKey, { href: "/tax-return-guide", eyebrow: "EOFY", title: "택스 리턴 제출 준비" }, parseTaxChecklist, ids => ({ active: ids.length > 0, detail: `${ids.length}/${taxChecklistIds.length}개 직접 체크`, progress: Math.round(ids.length / taxChecklistIds.length * 100) })));
  items.push(item(jobStorageKey, { href: "/job-application-tracker", eyebrow: "구직", title: "지원 현황" }, parseApplications, records => ({ active: records.length > 0, detail: `전체 ${records.length}건 · 진행 중 ${records.filter(record => record.status !== "closed").length}건` })));
  items.push(item("aussie-compass-savings-goal-v1", { href: "/savings-goal-calculator", eyebrow: "돈 관리", title: "저축 목표" }, parseSavings, data => ({ active: true, detail: `입력한 시작 잔액·목표와 저축 기록 ${data.checkIns.length}회가 있습니다. 현재 은행 잔액을 확인하고 계산기 입력을 갱신하세요.` })));
  items.push(item("aussie-compass-resume-v1", { href: "/resume-builder", eyebrow: "구직", title: "영문 이력서" }, parseResumeBuilderDraft, data => ({ active: !!resumePlainText(data), detail: `기본 작성 ${resumeEssentialCount(data)}/7개 · 개인정보는 여기에 표시하지 않습니다.`, progress: Math.round(resumeEssentialCount(data)/7*100) })));
  items.push(item("aussie-compass-salary-calculation", { href: "/salary-calculator", eyebrow: "급여", title: "저장한 급여 계산" }, parseSavedSalary, () => ({ active: true, detail: "검증된 형식의 계산 입력이 있습니다. 금액은 계산기에서 확인하세요." })));
  items.push(item("aussie-compass-living-budget-v1", { href: "/cost-of-living-calculator", eyebrow: "생활비", title: "생활비 예산" }, parseBudget, () => ({ active: true, detail: "저장된 예산 입력이 있습니다. 상세 금액과 실제 지출은 계산기에서 확인하세요." })));
  items.push(item("aussie-compass-life-reminders-v1", { href: "/life-admin-reminder", eyebrow: "생활 관리", title: "만료일·갱신 일정" }, parseReminders, records => ({ active: records.length > 0, detail: `${records.length}개의 일정 기록이 있습니다. 실제 알림 등록은 달력 앱에서 확인하세요.` })));
  items.push(item(RAIL_WORK_ALERT_STORAGE_KEY, { href: "/rail-work-alerts", eyebrow: "교통", title: "공사 구간 확인 계획" }, parseWatchAreas, records => ({ active: records.length > 0, detail: `${records.length}개 관심 지역 · 이동 전에 공식 공지와 대체 경로를 다시 확인하세요.` })));
  return { items, bookmarks: readLocalRecord(bookmarkKey, parseBookmarks, getStorage), reading: readLocalRecord(ARTICLE_READ_HISTORY_KEY, parseArticleHistory, getStorage) };
}
