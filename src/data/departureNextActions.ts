import type { DepartureTaskId } from "@/lib/departureNextAction";

export const departureJurisdictions = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const;

type Task = {
  id: DepartureTaskId;
  label: string;
  service: string;
  fixedAction: string;
  route: string;
  routeLabel: string;
  secondary?: { label: string; href: string };
  fallback: string;
  needsJurisdiction?: boolean;
};

const bondRoutes: Record<string, string> = {
  ACT: "https://www.revenue.act.gov.au/rental-bonds",
  NSW: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/getting-your-bond-back",
  NT: "https://nt.gov.au/property/private-renters/moving-out/when-you-are-owed-bond-money",
  QLD: "https://www.rta.qld.gov.au/rta-web-services/online-bond-refund",
  SA: "https://www.sa.gov.au/topics/housing/renting-and-letting/residential-bonds/bond-refunds",
  TAS: "https://www.cbos.tas.gov.au/topics/housing/renting/bonds",
  VIC: "https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/bond-claims-and-refunds",
  WA: "https://www.consumerprotection.wa.gov.au/rental-bonds",
};

const vehicleRoutes: Record<string, string> = {
  ACT: "https://www.accesscanberra.act.gov.au/driving-transport-and-parking/registration/selling-an-act-registered-vehicle",
  NSW: "https://www.service.nsw.gov.au/guide/selling-a-vehicle",
  NT: "https://nt.gov.au/driving/rego/existing-nt-registration/buying-selling-a-used-vehicle-registration/former-owner-responsibilities-seller",
  QLD: "https://www.qld.gov.au/transport/registration/transfer/rego",
  SA: "https://www.sa.gov.au/topics/driving-and-transport/registration/vehicle-registration/transfers",
  TAS: "https://www.service.tas.gov.au/services/transport/vehicle-registration/transfer-a-vehicle-registration/",
  VIC: "https://www.vicroads.vic.gov.au/buy-sell-transfer/selling-car/selling-vehicle",
  WA: "https://www.transport.wa.gov.au/licensing/vehicle/buy-sell-transfer/sell",
};

export const departureTasks: Task[] = [
  { id: "final_pay", label: "퇴사·마지막 급여", service: "Fair Work final pay", fixedAction: "Award·Agreement와 고용계약에서 지급 항목·시점을 확인하고, Payroll에 final pay와 수정 Payslip 예정일을 서면 요청하세요.", route: "https://www.fairwork.gov.au/ending-employment/final-pay", routeLabel: "Fair Work final pay", fallback: "실제 입금과 Payslip을 대조하기 전에는 완료로 표시하지 마세요." },
  { id: "bond", label: "퇴거·Bond", service: "주·준주 Bond 기관", fixedAction: "관할 공식 시스템에서 claim·dispute 절차와 시한을 확인하고, 반환액과 deduction 근거를 대조하세요.", route: "", routeLabel: "관할 Bond 공식 경로", fallback: "관할을 선택해야 공식 경로를 열 수 있습니다.", needsJurisdiction: true },
  { id: "utility", label: "전기·가스·인터넷", service: "Energy Made Easy", fixedAction: "provider에 최종 검침, 종료 효력일, 장비 반납과 final bill·credit 예정일을 확인하세요.", route: "https://www.energymadeeasy.gov.au/", routeLabel: "공식 energy 정보", fallback: "먼저 provider에 문의하고 미해결이면 관할 energy ombudsman 경로를 확인하세요." },
  { id: "telco_access", label: "전화번호·2FA", service: "ACMA·myGov", fixedAction: "번호 해지 전에 bank·myGov·ATO·Super의 해외 로그인과 복구 수단을 실제로 시험하세요.", route: "https://my.gov.au/en/about/help/mygov-website/sign-in-to-mygov/use-a-code-sent-by-sms", routeLabel: "myGov 해외 SMS 안내", secondary: { label: "ACMA telco 종료 안내", href: "https://www.acma.gov.au/switch-your-phone-or-internet-provider" }, fallback: "telco 문제는 provider에 먼저 complaint하고 미해결이면 TIO를 확인하세요." },
  { id: "bank_payment_route", label: "은행·지급 경로", service: "Moneysmart banking", fixedAction: "Bond·final pay·tax refund·DASP가 남아 있다면 계좌를 닫기 전에 각 지급의 EFT·cheque·해외송금 가능 여부와 해외 2FA를 확인하세요.", route: "https://moneysmart.gov.au/banking", routeLabel: "Moneysmart banking", fallback: "지급 방식은 각 은행·기관의 공식 안내에서 확인하고 계좌 상세는 이 사이트에 입력하지 마세요." },
  { id: "insurance_vehicle_mail", label: "보험·차량·우편", service: "주·준주 차량기관", fixedAction: "차량 이전·Rego와 보험 종료 확인을 받고, 필요한 우편만 공식 redirect로 바꾸세요.", route: "", routeLabel: "관할 차량 이전 경로", secondary: { label: "Australia Post 우편 redirect", href: "https://auspost.com.au/personal/receiving/mail-redirection-and-mail-hold/redirection" }, fallback: "차량은 등록 관할을 선택하고 보험 해지·환급은 provider 공식 경로에서 별도로 확인하세요.", needsJurisdiction: true },
  { id: "tax", label: "세금", service: "ATO outside-Australia tax return", fixedAction: "출국 뒤 신고 필요 여부와 방법을 ATO 또는 등록 세무사에게 확인하고, Income statement와 기록 접근을 유지하세요.", route: "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return/lodge-your-tax-return-from-outside-australia", routeLabel: "ATO 해외 신고 안내", fallback: "이 도구는 tax residency나 신고 의무를 판정하지 않습니다." },
  { id: "super_dasp", label: "Super·DASP", service: "ATO DASP guidance", fixedAction: "출국·모든 임시비자 종료·마지막 employer 납입을 확인한 뒤 ATO 안내에서 online, paper 또는 fund 경로를 선택하세요.", route: "https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/temporary-residents-and-superannuation/departing-australia-superannuation-payment-dasp", routeLabel: "ATO DASP 공식 안내", fallback: "DASP direct service가 열리지 않으면 반복 제출하지 말고 ATO guidance의 paper form, 해당 fund 또는 ATO-held Super 경로를 이용하세요." },
];

export function taskRoute(task: Task, jurisdiction: string) {
  if (task.id === "bond") return bondRoutes[jurisdiction] ?? "";
  if (task.id === "insurance_vehicle_mail") return vehicleRoutes[jurisdiction] ?? "";
  return task.route;
}
