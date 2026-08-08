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
    id: "pay-calculator",
    name: "급여 계산기",
    description: "시급을 기준으로 예상 주급, 월급, 연봉을 계산합니다.",
    status: "available",
    featured: true,
  },
  {
    id: "tax-calculator",
    name: "소득세 계산기",
    description: "호주 예상 소득세와 세후 소득을 계산합니다.",
    status: "available",
  },
  {
    id: "super-calculator",
    name: "Super 계산기",
    description: "고용주가 납부하는 예상 Super 금액을 계산합니다.",
    status: "available",
  },
  {
    id: "minimum-wage-guide",
    name: "최저임금 가이드",
    description: "호주 최저임금과 캐주얼 로딩을 쉽게 알아봅니다.",
    status: "comingSoon",
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
