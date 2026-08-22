# 최근 28일 성장 기준선

기간: 2026-07-27 ~ 2026-08-23 · Australia/Sydney

생성일: 2026-08-23

판단 규칙: 각 경로의 분모가 10회 미만이면 수치만 기록하고 결론은 보류한다.

## 기준선 점수표

| 지표 | 분자 / 분모 | 현재 값 | 상태 | 지금 내릴 결론 |
| --- | --- | --- | --- | --- |
| 검색 CTR | 검색 클릭 / 노출 | Search Console 미연결 | 측정 전 | 없음 |
| 글→도구 | 무료 도구 클릭 / 자료 글 조회 | 0 / 0 | 표본 없음 | 없음 |
| 도구 완료 | 완료 이벤트 / 측정 가능한 도구 조회 | 0 / 0 | 표본 없음 | 없음 |
| Resume Pro 방문→결제 시작 | 0 / 1 | — | 분모 10 미만 | 없음 |
| Resume Pro 결제 시작→구매 | 0 / 0 | — | 표본 없음 | 없음 |
| Rental Pack Pro 방문→결제 시작 | 0 / 0 | — | 판매 전 | 없음 |
| Rental Pack Pro 결제 시작→구매 | 0 / 0 | — | 판매 전 | 없음 |
| 환불 차감 순매출 | 결제 완료액 - 환불액 | A$0.00 | 통제 검증 구매 제외 | 고객 매출 기준선 0 |
| 환불률 | 환불 구매 / 고객 구매 | — | 고객 구매 0 | 없음 |
| 접근 실패율 | 실패 / 활성화·복구 시도 | 기존 기간 측정 이벤트 없음 | 새 계측 시작 전 | 없음 |

Stripe 읽기 전용 집계에는 Resume Pro A$19.90 결제 1건이 보인다. 이 결제는 2026-08-20에 진행한 통제된 실결제·전액 환불 검증이며 고객 구매가 아니다. 마케팅 기준선에서는 구매와 매출에서 제외한다. 환불·순매출 자동 집계는 현재 제한 키에 Charges 또는 Refunds 읽기 권한이 없어 회계 기록과 함께 확인했다.

Vercel 집계에서 현재 확인되는 Resume Pro 방문은 1회뿐이다. 나머지 흐름은 표본이 없으며, 0을 실패로 해석하지 않는다.

## 앞으로 매주 같은 방식으로 기록

| 지표 | 데이터 원천 | 기록 단위 | 개인정보 처리 |
| --- | --- | --- | --- |
| 검색 CTR | Google Search Console | 검색 페이지·검색어 묶음의 노출, 클릭, CTR | 개인 식별정보 없음. 검색어 원문은 운영 점수표에 복사하지 않고 주제 묶음으로만 판단 |
| 글→도구 | Vercel `Article Next Step` + 글 pageview | 전체와 글별 집계 | 글 slug, `destination=free_tool`만 허용 |
| 도구 완료 | Vercel 완료 이벤트 + 도구 pageview | 도구별 집계 | 제품 코드와 미리 정한 완료 상태만 허용 |
| Pro 퍼널 | Vercel 제품 방문·Checkout Started + Stripe paid Checkout | 제품·허용된 `entry`별 집계 | 이름, 이메일, 결제 ID를 점수표에 가져오지 않음 |
| 순매출·환불 | Stripe | 제품별 결제액 - 환불액 | 금액, 통화, 제품 코드, 생성일만 집계 |
| 접근 실패 | 허용된 `Pro Access Failed` 이벤트 | 제품·실패 이유 enum별 집계 | 세션 ID, 복구 코드, 오류 원문을 보내지 않음 |

## 개인정보 허용목록

허용:

- pageview: `requestPath`
- `Article Next Step`: `destination`
- `Resume Builder Completed`: `product`, `essentials`
- `Job Move Survey Completed`: `entry`
- `Resume Pro Viewed`: `entry`, `checkout`
- `Rental Application Pro Viewed`: `entry`, `checkoutAvailable`
- `Checkout Started`: `product`, `entry`
- `Pro Access Attempted`: `product`, `flow`
- `Pro Access Failed`: `product`, `reason`
- Stripe 집계: `product_code`, `acquisition_source`, 금액, 통화, 결제 상태, 생성 시각

금지:

- 이름, 이메일, 전화번호, 주소
- IP나 개인별 방문 기록
- 전체 카드번호, 카드 마지막 네 자리, 결제수단 정보
- Checkout Session·Payment Intent·Charge ID
- 이용권 토큰, 복구 코드, 쿠키
- 이력서·커버레터·렌트 소개문과 자유 입력 원문
- 개인 블로그의 사람, 장소, 날짜, 관계를 알아볼 수 있는 내용

새 이벤트나 속성은 이 목록에 먼저 추가하고 개인정보 안내와 실제 코드가 일치하는지 확인한 뒤 사용한다.

## 자동 집계 실행

로컬 `.env.local`에 기존 읽기 전용 연결이 있을 때 실행한다.

```bash
npm run growth:baseline
```

스크립트는 28일 집계값과 허용목록만 출력한다. 비밀 키, 고객 정보, Stripe 객체 ID는 출력하지 않는다. Search Console은 아직 연결하지 않았으므로 검색 CTR은 빈 값으로 남긴다.

## 다음 기준선에서 필요한 것

1. Search Console에서 같은 28일의 노출·클릭·CTR만 가져온다.
2. 접근 시도는 `activate`, `restore`만, 실패 이유는 코드에 정한 네 값만 기록한다. 새 값을 임의로 만들지 않는다.
3. Stripe 제한 키에 필요한 최소 Refunds 읽기 권한을 줄지 별도 보안 검토한다. 권한을 늘리지 않으면 회계 기록에서 환불 차감 순매출만 수동 입력한다.
4. 표본 10 미만 경로에는 색이나 승자 표시를 붙이지 않는다.

참고:

- Vercel Web Analytics API: https://vercel.com/changelog/web-analytics-api
- Vercel Analytics privacy: https://vercel.com/docs/analytics/privacy-policy
