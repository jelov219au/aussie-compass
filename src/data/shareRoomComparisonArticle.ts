import type { Article } from "./articles";

export const shareRoomComparisonArticle: Article = {
  slug: "nsw-share-room-comparison-four-checks",
  title: "NSW 쉐어 방 두 개, 주세 말고 네 칸으로 비교하세요",
  socialTitle: "NSW 쉐어 방 두 개, 관계·비용·상태·미확인으로 비교하기",
  description: "후보 A와 B에 같은 질문을 적고, 계약 관계·입주 현금과 반복 비용·관찰한 상태·남은 질문을 나눠 비교하는 짧은 메모 안내입니다.",
  category: "집 구하기",
  region: "nsw",
  contentType: "community",
  readingTime: "4분",
  publishedAt: "2026-09-09",
  quickSummary: [
    "종이나 메모 앱에 후보 A·B를 나란히 놓고 관계·비용·상태·미확인 네 칸을 만드세요.",
    "입주 때 준비할 현금과 반복 지출, 직접 본 상태와 상대의 설명을 나누세요.",
    "모르는 칸은 추정하지 말고 질문·답할 담당 역할·다시 확인할 날짜를 붙이세요.",
  ],
  toolHref: "/property-inspection-checklist",
  toolLabel: "집 보러가기 체크리스트 열기",
  relatedSlugs: [
    "australia-sharehouse-photo-vs-reality-checklist",
    "rental-inspection-to-application-guide",
    "rental-condition-report-bond-first-week-australia",
  ],
  editorialTrust: {
    contentScope: "article",
    sourceAuthority: "primary_law_or_regulator",
    jurisdiction: "NSW 주거임대. 다른 주·사회주택·boarding/lodging에는 그대로 적용하지 않습니다.",
    eligibility: "쉐어 후보를 비교하며 실제 계약 관계와 적용 규칙을 확인하려는 사람",
    claimDateBasis: "2026-09-09 NSW Fair Trading 공식 본문 확인. 개인의 법적 지위나 청구 가능 비용을 판정하지 않습니다.",
    checkedOn: "2026-09-09",
    version: "2026-09-09",
    disclosures: [
      "A·B는 실제 매물이 아닌 가상 사례이며, 네 칸 메모는 편집부의 기록 제안입니다.",
      "공식 자료를 참고한 일반 정보로 기관 감수·계약 안전 보증·개별 법률 자문이 아닙니다.",
    ],
  },
  sections: [
    {
      heading: "후보 A와 B에 같은 네 칸을 만드세요",
      paragraphs: [
        "A는 주세가 낮지만 공과금이 별도이고, B는 주세가 높지만 전기와 인터넷이 포함된 가상의 방이라고 해볼게요. 별도 청구 기준과 포함 조건을 모르면 어느 쪽의 실제 부담이 작은지 아직 정할 수 없습니다.",
        "종이나 메모 앱에 아래 네 칸을 후보별로 똑같이 만드세요. 이 글은 NSW에서 확인할 순서를 설명합니다. 다른 주·사회주택·boarding/lodging에는 그대로 적용하지 말고 해당 계약의 규칙을 먼저 확인하세요.",
      ],
      bullets: [
        "관계: 계약 상대 / 설명받은 계약 형태 / 확인 문서와 날짜",
        "비용: 포함·별도 항목과 납부 주기 / 입주 현금 / 반복 지출",
        "상태: 직접 관찰 / 상대 설명 / 확인하지 못한 부분",
        "미확인: 다음 질문 / 답할 담당 역할 / 다시 확인할 날짜",
      ],
    },
    {
      heading: "관계: 누구와 어떤 문서로 계약하나요?",
      paragraphs: [
        "NSW 공식 안내는 전대, 기존 계약의 이전·공동임차인 추가, 추가 거주자를 구분합니다. 전대나 계약 이전에는 집주인의 서면 동의가 필요하고, 추가 거주자는 동의가 필요하지 않더라도 계약의 허용 인원을 넘을 수 없습니다. 사회주택은 제공자의 별도 정책을 따릅니다.",
        "A가 기존 임차인과 별도 계약하고 B가 기존 계약에 함께 들어간다는 설명을 받았다면, 그 설명만으로 법적 지위를 확정하지 마세요. 두 곳 모두 계약 상대·계약 형태·이를 확인할 문서를 요청하고, 문서와 설명이 다르면 NSW Fair Trading에 확인할 질문으로 남깁니다.",
      ],
    },
    {
      heading: "비용: 입주 현금과 반복 지출을 나누세요",
      paragraphs: [
        "A에는 별도 공과금의 계산 근거와 납부 주기를, B에는 포함되는 항목과 사용 한도·추가 청구 조건을 물어보세요. 두 후보 모두 같은 질문에 답을 받아야 비교할 수 있습니다. 이 질문은 비용의 적법성을 판정하는 기준은 아닙니다.",
        "입주 현금에는 보증금·선불 임대료·이사비처럼 처음 준비할 돈을, 반복 지출에는 주세·별도 공과금·통근비를 따로 적으세요. 선불 임대료가 어느 기간의 집세인지 표시해 같은 기간의 지출로 두 번 더하지 않습니다. 금액 옆에는 주·월 등 납부 주기를 붙이고, 아직 모르면 0원 대신 ‘미확인’으로 남기세요.",
      ],
    },
    {
      heading: "상태: 직접 본 것과 설명만 들은 것을 나누세요",
      paragraphs: [
        "‘방 괜찮음’ 대신 ‘창문 아래 검은 얼룩을 봄, 원인은 미확인’이라고 적어보세요. ‘수리하겠다’는 답변은 상대 설명에 남기고, 실제 수리 완료를 확인한 기록과 구분합니다. A와 B 모두 같은 항목을 관찰하고 촬영 허락과 다른 거주자의 사생활을 지켜주세요.",
        "방문 비교 메모는 공식 condition report를 대신하지 않습니다. NSW 안내는 세입자 부분을 작성해 입주 후 7일 안에 한 부를 돌려주고 날짜가 남는 사진과 사본을 보관하도록 설명합니다. 다만 같은 사람들이 계약을 갱신하거나 새 공동임차인·거주자가 기존 임대에 합류할 때는 새 보고서가 필요하지 않다는 예외가 있습니다. 본인에게 적용되는 문서와 절차부터 확인하세요.",
      ],
    },
    {
      heading: "미확인: 빈칸 하나에 다음 질문 하나를 붙이세요",
      paragraphs: [
        "A의 공과금 기준이 없다면 ‘포함 항목·사용 한도·별도 비용의 계산과 납부 주기를 글로 보내주실 수 있나요?’라고 묻습니다. B의 수리 약속만 있다면 ‘무엇을 언제까지 수리하고, 입주 전에 완료를 어떻게 확인하나요?’라고 묻습니다. 답할 담당 역할과 다시 확인할 날짜도 적으세요.",
        "A 선택·B 선택 외에 ‘추가 확인 뒤 결정’도 가능합니다. 핵심 조건이 비어 있거나 설명과 문서가 다르면 송금·서명을 서두르지 마세요. 확인한 답을 네 칸에 반영한 뒤 비교하고, 현장에서는 아래 집 보러가기 체크리스트로 필요한 항목을 확인하세요. 체크 수나 메모 자체가 계약의 안전을 보증하지는 않습니다.",
      ],
    },
  ],
  sources: [
    {
      label: "NSW Government — Sharing a residential rental property",
      href: "https://www.nsw.gov.au/housing-and-construction/rules/sharing-a-residential-rental-property",
      summary: "2026-09-09 확인. 공유임대 형태, 전대·계약 이전의 서면 동의, 추가 거주자의 허용 인원과 사회주택의 별도 정책을 확인하는 공식 안내입니다.",
    },
    {
      label: "NSW Government — Rental property condition reports",
      href: "https://www.nsw.gov.au/housing-and-construction/rules/rental-property-condition-reports",
      summary: "2026-09-09 확인. 세입자의 상태보고서 작성·7일 반환·사진 보관과 기존 계약 갱신 또는 새 공동임차인·거주자 합류 시 새 보고서가 필요하지 않은 예외를 안내합니다.",
    },
  ],
};
