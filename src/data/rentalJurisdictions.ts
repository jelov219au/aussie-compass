export const rentalJurisdictionCodes = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export type RentalJurisdictionCode = (typeof rentalJurisdictionCodes)[number];

export type RentalJurisdictionGuide = {
  code: RentalJurisdictionCode;
  name: string;
  authority: string;
  href: string;
  summary: string;
  checkpoints: readonly string[];
};

export const rentalJurisdictions: readonly RentalJurisdictionGuide[] = [
  {
    code: "NSW",
    name: "New South Wales",
    authority: "NSW Government",
    href: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/starting-a-residential-tenancy/finding-and-applying-for-a-rental-property",
    summary: "신청 승인 전 holding fee 요구 여부와 광고 금액보다 높은 렌트를 유도하는지 확인하세요.",
    checkpoints: ["Holding fee는 신청이 승인된 뒤에만 요구되는지 확인", "신청비·rent bidding 요구가 없는지 확인"],
  },
  {
    code: "VIC",
    name: "Victoria",
    authority: "Consumer Affairs Victoria",
    href: "https://www.consumer.vic.gov.au/housing/renting/starting-and-changing-rental-agreements/applying-signing-and-moving-in/applying-for-a-property",
    summary: "2026년 3월 31일부터 prescribed application form과 제한된 정보 요청 범위가 적용됩니다.",
    checkpoints: ["공식 prescribed application form인지 확인", "신원·지불 능력 증빙의 종류와 개수가 허용 범위인지 확인"],
  },
  {
    code: "QLD",
    name: "Queensland",
    authority: "Residential Tenancies Authority",
    href: "https://www.rta.qld.gov.au/forms-resources/factsheets/rental-application-process-tenants-and-residents",
    summary: "일반 임대는 Form 22, rooming accommodation은 Form R22가 기준이며 신청·개인정보 처리 규칙이 있습니다.",
    checkpoints: ["임대 유형에 맞는 표준 신청서인지 확인", "신청 방법과 개인정보 보관·파기 안내를 확인"],
  },
  {
    code: "WA",
    name: "Western Australia",
    authority: "Consumer Protection WA",
    href: "https://www.consumerprotection.wa.gov.au/rent-bidding-applications-and-option-fees",
    summary: "광고는 고정 금액이어야 하며 집주인이나 에이전트가 더 높은 렌트를 제안하도록 압박할 수 없습니다.",
    checkpoints: ["광고 렌트가 고정 금액인지 확인", "Option fee를 요구한다면 환급·첫 렌트 차감 조건을 확인"],
  },
  {
    code: "SA",
    name: "South Australia",
    authority: "Consumer and Business Services",
    href: "https://www.cbs.sa.gov.au/campaigns/rental-reforms",
    summary: "2026년 1월 1일부터 대부분의 민간 임대 신청에 Form A1을 사용하며 정보 요청 범위가 제한됩니다.",
    checkpoints: ["각 성인 신청자가 Form A1을 사용하는지 확인", "불필요한 신원·재정·적합성 자료를 추가로 요구하는지 확인"],
  },
  {
    code: "TAS",
    name: "Tasmania",
    authority: "Consumer, Building and Occupational Services",
    href: "https://www.cbos.tas.gov.au/topics/housing/renting",
    summary: "계약, 선납 비용, tenancy database와 입주 전 조건을 CBOS의 공식 Renting 안내에서 확인하세요.",
    checkpoints: ["계약 형태와 upfront entry costs 공식 안내를 확인", "서명할 조건과 제공받을 문서를 서면으로 확인"],
  },
  {
    code: "ACT",
    name: "Australian Capital Territory",
    authority: "ACT Government",
    href: "https://www.act.gov.au/housing-planning-and-property/renting",
    summary: "Renting Book과 계약 전 필수 안내를 확인하고, 광고가보다 높은 렌트를 제안하도록 유도받지 않았는지 점검하세요.",
    checkpoints: ["Renting Book과 계약 전 제공 문서를 확인", "에이전트나 신청 플랫폼이 rent bidding을 유도하지 않는지 확인"],
  },
  {
    code: "NT",
    name: "Northern Territory",
    authority: "Northern Territory Consumer Affairs",
    href: "https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies",
    summary: "Tenancy 유형, 선납 비용과 영수증, 서면 조건을 확인하고 최신 안내는 NT Consumer Affairs에서 다시 확인하세요.",
    checkpoints: ["Tenant·boarder·lodger 중 적용되는 유형을 확인", "Bond·선납 비용과 영수증 조건을 서면으로 확인"],
  },
] as const;

export function getRentalJurisdiction(code: string | null | undefined) {
  return rentalJurisdictions.find((jurisdiction) => jurisdiction.code === code) ?? null;
}
