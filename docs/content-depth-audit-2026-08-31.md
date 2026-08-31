# 콘텐츠 깊이 전수 감사 — 2026-08-31

## 결론

- 판정: **주의사항과 함께 호환**. 모든 변경은 같은 Next.js 라우트와 공용 컴포넌트를 사용하므로 데스크톱 웹, 모바일 웹, 설치형 PWA에서 같은 내용을 제공한다.
- 네트워크 주의: 정부·공공기관 원문과 전화·예약 화면은 인터넷 또는 전화 연결이 필요하다. 설치형 PWA가 외부 원문을 오프라인으로 제공한다고 표현하지 않는다.
- 리소스 기준: 공휴일 중복 통합 후 35개 글, 372개 실행 섹션, 232개 출처. 각 리소스 글은 최소 6개 핵심 섹션과 3개 출처를 유지한다. 최초 감사의 36개 공개 글 중 이전 공휴일 주소 하나는 308 영구 이동으로 보존한다.
- 판단 기준: 글자 수를 늘리는 대신 적용 기준, 예외, 준비물, 증빙, 문의 문장, 결과 뒤 행동과 공식 원문 중 해당 페이지 목적에 필요한 요소를 확인했다.

## 이번 묶음에서 직접 확장한 고위험 흐름

| 영역 | 라우트 | 보강 결과 |
|---|---|---|
| 직장 사고 | `/resources/australia-workplace-injury-workers-compensation-guide` | 치료·고용주 통지·주별 Claim·안전기관 통지·복귀·이의제기 |
| 휴가 | `/leave-guide` | 8개 휴가 유형, Shutdown·Cash out, 증빙·Privacy, 퇴사·산재 구분 |
| 퇴사·해고 | `/resources/australia-job-ending-final-pay-dismissal-guide` | Notice·Final pay·Redundancy·21일 기한·비자·FEG |
| 재정 곤란 | `/resources/australia-financial-hardship-bills-debt-guide` | 연체 전 Hardship, 필수비 우선, Credit report, AFCA, 채권추심 |
| 중고거래 | `/resources/australia-secondhand-marketplace-safe-buying-guide` | Courier 사기, Business seller ACL, Major·Minor problem, Complaint |
| 해외면허 | `/overseas-driver-licence-guide` | 8개 주·준주 선택, 기준일·시험·번역·보험·불합격 영향 |
| Super | `/super-guide` | Payslip 대 실제 입금, 미납 확인·ATO 신고, Fund·보험·사기 |
| 공식 도움 | `/help-directory` | 000·중독·의료·가정폭력·통역·직장·재정·사기 라우팅 |
| Tax return | `/tax-return-guide` | Tax residency·해외소득·환급/납부·Notice·Amendment |

## 데이터 기반 리소스 35개 전수 판정

아래 리소스는 모두 공용 `/resources/[slug]` 화면에서 핵심요약, 실행 섹션, 공식 출처와 다음 행동을 제공한다.

### 직장·급여·구직

- `australia-job-ending-final-pay-dismissal-guide`
- `australia-workplace-injury-workers-compensation-guide`
- `australia-public-holiday-work-pay-guide`
- `australia-job-search-plan`
- `australia-resume-template-submission-checklist`
- `australia-cover-letter-job-ad-checklist`
- `english-resume-achievement-examples`
- `first-payslip-checklist-australia`
- `unpaid-trial-shift-australia-guide`
- `abn-employee-or-contractor-australia`
- `first-job-super-fund-stapled-account-guide`
- `australia-job-scam-red-flags`

공휴일 글은 `australia-public-holiday-work-pay-guide`로 통합했다. 이전 `australia-public-holiday-pay-guide` 주소와 공유 이미지 경로는 308 영구 이동한다. 근무 기반 지역·부분 공휴일·Classification·RDO·초과근무 중복·Payslip 대조와 서면 문의를 통합 글에 보존했고, Fair Work 공식 원문을 2026-08-31 다시 확인했다. 검색·RSS·사이트맵에는 통합 글만 노출한다. 기존 기기 내 읽기 기록은 조회 시 통합 URL로 연결하고 중복을 제거하되, 조회만으로 저장 데이터를 덮어쓰지 않는다. 실제 설치형 PWA 기기 검증은 별도로 수행하지 않았다.

### 정착·돈·생활

- `australia-financial-hardship-bills-debt-guide`
- `australia-arrival-english-clarifying-phrases`
- `emergency-fund-australia-guide`
- `casual-income-budget-australia`
- `tfn-application-after-arrival-australia`
- `australia-gp-hospital-pharmacy-guide`
- `australia-sim-esim-setup-guide`
- `australia-home-internet-moving-guide`
- `australia-bank-account-opening-guide`
- `australia-energy-plan-moving-home-guide`
- `australia-grocery-unit-price-budget-guide`
- `australia-secondhand-marketplace-safe-buying-guide`
- `korea-working-holiday-visa-2026-fact-check`

### 주거·이동

- `rental-application-privacy-australia`
- `australia-rental-scam-red-flags`
- `used-car-ppsr-purchase-day-checklist`
- `rental-condition-report-bond-first-week-australia`
- `australia-rental-repairs-maintenance-guide`
- `australia-rental-moving-out-bond-refund-guide`
- `australia-sharehouse-photo-vs-reality-checklist`
- `sydney-weekend-commute-reality-check`
- `melbourne-home-transport-first-check-guide`
- `brisbane-home-transport-flood-first-check-guide`

## 독립 가이드와 도구 판정

### 설명 자체가 핵심인 페이지 — 깊이 확인 완료

- 급여·고용: `/minimum-wage-guide`, `/award-guide`, `/casual-loading-guide`, `/payslip-guide`, `/underpayment-guide`, `/leave-guide`, `/super-guide`
- 세금·정착: `/tax-return-guide`, `/arrival-checklist`, `/moving-checklist`, `/visa-preparation-guide`, `/leaving-australia-guide`, `/help-directory`
- 주거·이동: `/property-inspection-checklist`, `/public-transport-guide`, `/overseas-driver-licence-guide`, `/used-car-comparison`

### 도구 중심 페이지 — 목적상 간결 유지

`/salary-calculator`, `/pay-calculator`, `/tax-calculator`, `/super-calculator`, `/cost-of-living-calculator`, `/savings-goal-calculator`, `/life-admin-reminder`, `/job-application-tracker`, `/tax-prep-tracker`, `/service-price-log`, `/service-quote-comparator`, `/rail-work-alerts`, `/english-phrase-cards`, `/glossary`, `/search`, `/my-compass`는 입력·결과·저장 경계를 가리지 않는 선에서 해석과 다음 행동을 제공한다. 장문을 추가해 핵심 작업을 밀어내지 않는다.

### 정보 확장 대상이 아닌 페이지

결제·제품 소개, 계정·데이터 이동, 연락·운영, Privacy·Terms·Disclaimer·Editorial policy, 설치·Offline 페이지는 각각 거래 조건, 상태, 개인정보, 운영 정책 또는 기술 경계를 정확히 전달하는 것이 목적이다. 일반 생활 콘텐츠 분량 기준을 적용하지 않는다.

## 남은 일의 성격

현재 감사에서 발견된 추가 고위험 콘텐츠 공백은 없다. 공휴일 중복 URL의 Canonical 정리도 완료했다. 이후 작업은 새로운 법·제도 변경 반영, 공식 링크 상태 재검증, 이용 데이터에 따른 탐색 개선처럼 유지보수 성격이다. 이는 결제·추천 순위·리드 수집 기능을 추가하지 않는다.
