export type ToolStatus = "available" | "availableSoon" | "comingSoon";

export type Tool = {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  featured?: boolean;
};

export const tools: Tool[] = [
  {
    id: "salary-calculator",
    name: "통합 급여 계산기",
    description: "시급과 근무시간 한 번 입력으로 세전·세후 급여, Super와 총 패키지를 확인합니다.",
    status: "available",
    featured: true,
  },
  {
    id: "minimum-wage-guide",
    name: "최저임금 가이드",
    description: "호주 최저임금과 캐주얼 로딩을 쉽게 알아봅니다.",
    status: "available",
  },
  {
    id: "cost-of-living-calculator",
    name: "생활비 계산기",
    description: "현실적인 호주 생활 예산을 계획합니다.",
    status: "comingSoon",
  },
  {
    id: "resume-builder",
    name: "이력서 작성 도구",
    description: "호주 취업에 맞는 실용적인 이력서를 준비합니다.",
    status: "comingSoon",
  },
];

export const toolStatusLabels: Record<ToolStatus, string> = {
  available: "사용 가능",
  availableSoon: "곧 사용 가능",
  comingSoon: "준비 중",
};
