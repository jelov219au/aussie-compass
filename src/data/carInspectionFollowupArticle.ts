import type { Article } from "./articles";

export const carInspectionFollowupArticle: Article = {
  slug: "used-car-inspection-report-next-steps",
  title: "중고차 검사 보고서를 받은 뒤, 무엇을 해야 할까?",
  socialTitle: "After a used-car inspection: questions, repair promises and your decision",
  description: "판매자가 고쳐주겠다고 했을 때 무엇을 받아야 할까요? 검사 항목을 다음 질문, 비용, 수리 증빙과 구매 결정으로 연결하는 기록 방법을 정리했습니다.",
  category: "차량 구매",
  region: "australia",
  contentType: "official",
  readingTime: "6분",
  publishedAt: "2026-09-03",
  updatedAt: "2026-09-05",
  quickSummary: [
    "보고서의 빈칸·미검사 항목을 ‘문제 없음’으로 읽지 말고 검사자에게 남은 확인을 묻기",
    "판매자의 답변, 수리 약속, 증빙·재확인을 서로 다른 단계로 기록하기",
    "견적 미확정은 0원이 아니에요. 현재 계산 가능한 비용과 아직 모르는 비용을 나누기",
  ],
  toolHref: "/used-car-comparison#vehicle-comparison-heading",
  toolLabel: "무료 후보·비용 비교표 열기",
  relatedSlugs: ["used-car-ppsr-purchase-day-checklist"],
  sections: [
    {
      heading: "보고서를 받았다는 사실보다, 무엇을 확인했는지가 중요해요",
      paragraphs: [
        "NSW 정부는 중고차 구매 전에 독립적인 면허 보유 정비업자나 정비사의 검사를 고려하라고 안내합니다. PPSR 공식 안내도 기계 상태 검사와 등록 확인을 별도 확인으로 설명합니다. 보고서 한 장이 모든 확인을 대신하는 것은 아니에요.",
        "아래 순서는 이 공식 안내를 바탕으로 Hoju Compass가 제안하는 기록 방법입니다. 결함의 심각도를 직접 진단하거나 구매 여부를 판정하는 기준표는 아닙니다. 다른 주·준주의 등록·거래 규정은 해당 기관에서 별도로 확인하세요.",
      ],
    },
    {
      heading: "첫 번째로, 검사자가 보지 못한 부분부터 표시하세요",
      paragraphs: [
        "보고서의 ‘not inspected’, ‘unable to test’, ‘further diagnosis required’ 같은 표현을 그대로 옮겨 적으세요. 항목이 비어 있다면 검사하지 않은 것인지, 확인했지만 보고서에 빠진 것인지 검사자에게 묻습니다. 빈칸을 양호로 바꾸지 마세요.",
        "내가 해석한 결론과 검사자의 말을 섞지 않는 것이 좋아요. ‘엔진 문제’ 대신 ‘보고서 p.3: 누유 흔적, 원인 추가 진단 필요’처럼 출처와 표현을 남기면 다음 문의가 구체적이 됩니다.",
      ],
      bullets: ["검사한 날짜와 보고서 쪽수", "확인한 내용과 검사하지 못한 내용", "추가로 누구에게 무엇을 물을지", "다음 확인 날짜와 아직 답변받지 못한 질문"],
    },
    {
      heading: "‘타이어를 갈아줄게요’는 완료 기록이 아니에요",
      paragraphs: [
        "가상 사례입니다. 검사에서 앞 타이어 마모를 지적했고 판매자가 인도 전 교체하겠다고 답했어요. 이때 기록은 ‘수리 약속을 받음’입니다. 날짜나 ‘done’이라는 짧은 답변만으로 실제 교체와 상태까지 확인했다고 쓰지 마세요.",
        "어떤 작업을 언제까지, 누구의 비용으로 하기로 했는지 글로 확인하고, 완료 뒤에는 작업을 보여주는 영수증·내역 등 증빙과 필요 시 독립 재확인 내용을 남기세요. 증빙을 받는 것과 그 내용이 실제 차량에 해당하는지 확인하는 것도 다른 일입니다.",
        "이 기록 방식 자체가 수리 이행이나 계약의 법적 효력을 보증하지는 않습니다. 이미 계약하거나 돈을 보냈다면 취소 가능 여부를 단정하지 말고 계약 내용과 거래 방식에 맞는 안내를 확인하세요.",
      ],
      bullets: ["답변 받음: 판매자가 무엇이라고 했나", "수리 약속: 작업 범위·예정일·비용 부담은 무엇인가", "증빙 받음: 어떤 작업 내역을 받았나", "재확인: 누가 언제 무엇을 확인했고 남은 문제가 있나"],
    },
    {
      heading: "견적 없는 차를 ‘더 싼 차’라고 결론 내리지 마세요",
      paragraphs: [
        "다음 숫자는 계산 설명용 가상 예시이며 시세·수수료 견적이 아닙니다. A 차량은 합의 차값 8,200달러와 검사·이전 예산 600달러로 현재 소계가 8,800달러입니다. 타이어는 판매자 부담으로 표시했지만 실제 이행은 아직 확인하지 못했어요.",
        "B 차량은 차값 7,900달러와 같은 예산 600달러로 현재 소계가 8,500달러입니다. 하지만 누유 수리 견적은 아직 없어요. ‘300달러 저렴하다’는 차이는 지금 적힌 금액 사이의 차이일 뿐 최종 총비용 비교가 아닙니다.",
        "금액이 없는 항목에는 ‘미확정’을 남기세요. 부담자가 정해지지 않은 비용은 따로 표시합니다. 구매자가 내기로 한 수리비도 견적 450달러 뒤 실제 지출 470달러가 나왔다면 같은 항목을 920달러로 더하지 않고, 견적과 실지출을 분리해 기록하세요.",
      ],
    },
    {
      heading: "보내기 전에 고쳐 쓸 영문 질문 두 가지",
      paragraphs: [
        "수리 약속 뒤: Could you confirm what will be repaired, who will pay, and when it will be completed? Could you provide the repair evidence and confirm whether an independent recheck can be arranged?",
        "검사 범위가 불명확할 때: The report says that further diagnosis is required. What remains unconfirmed, what additional inspection is recommended, and what would it cost?",
        "첫 문안은 판매자에게 수리 약속을 확인할 때, 두 번째는 검사자에게 보고서의 남은 확인을 물을 때 쓸 초안입니다. 차에 맞게 수정하세요. 질문을 보내는 일과 구매에 동의하는 일은 구분하고, 이미 체결한 계약의 조건을 메시지 하나로 바꿀 수 있다고 가정하지 마세요.",
      ],
    },
    {
      heading: "마지막에는 ‘내 결정’과 ‘결정 당시 남은 일’을 함께 남기세요",
      paragraphs: [
        "추가 확인 / 구매 검토 / 후보 제외 중 현재 결정을 고르고 이유를 한 줄 적어보세요. ‘아직 견적 없음’, ‘수리 증빙은 받았지만 재검 전’, ‘예산을 넘어서 제외’처럼 다음 행동이 드러나면 좋습니다. 기록에 미해결 항목이 0개여도 빠뜨린 검사가 없거나 차량이 안전하다는 뜻은 아닙니다.",
        "이후 결정이 바뀌면 이전 이유를 지우기보다 날짜별로 당시 기록을 남기세요. 실제 구매·인도를 마친 뒤에는 받은 서류 종류와 남은 후속 확인을 덧붙일 수 있습니다. 기록에는 별칭을 쓰고 신분증·계좌번호 등 불필요한 개인정보를 넣지 마세요.",
        "기본 구매 순서와 후보별 비용 비교는 기존 무료 가이드에서 이용할 수 있습니다. 중고차 거래노트 Pro는 이 후속 기록을 돕도록 개발 중이며, 아직 가격 확정이나 판매를 시작하지 않았습니다.",
      ],
    },
  ],
  sources: [
    {
      label: "NSW Government — Vehicle inspections checklist",
      href: "https://www.nsw.gov.au/driving-boating-and-transport/buying-and-selling-vehicles/buying-a-used-vehicle/vehicle-inspections-checklist",
      summary: "2026-09-03 확인. 구매 전 검사와 독립적인 면허 보유 정비업자·정비사의 검사 안내. 이 글의 기록 양식과 가상 비용 사례는 Hoju Compass의 제안입니다.",
    },
    {
      label: "PPSR — Do a used car or vehicle search",
      href: "https://www.ppsr.gov.au/carcheck",
      summary: "2026-09-03 확인. PPSR 검색과 별도로 기계 상태·차량 등록을 확인하도록 안내합니다. 공식 조회를 이 거래노트가 대신하지 않습니다.",
    },
    {
      label: "NSW Government — Vehicle repairs and maintenance",
      href: "https://www.nsw.gov.au/driving-boating-and-transport/buying-and-selling-vehicles/vehicle-repairs-and-maintenance",
      summary: "2026-09-05에 비용·기간 견적과 작업 확인 부분을 확인했습니다. NSW의 정비 견적을 부품·공임과 함께 서면으로 받고, 수리 소요 시간과 추가 작업 승인 범위를 묻는 안내입니다. 이 글의 견적·증빙 기록에 대한 근거이며 다른 주나 개인 계약의 결과를 보장하지 않습니다.",
    },
  ],
};
