# Public data and external asset trust contract

Hoju Compass가 정부·교통기관 자료를 링크하거나 향후 데이터셋/API를 사용할
때 적용하는 공개 신뢰 경계다. 정부 출처라는 사실은 Hoju Compass 서비스가
공식·승인·보증된다는 뜻이 아니며, 원문 사실과 Hoju Compass의 계산·요약·
해석을 같은 문장이나 상태로 합치지 않는다.

홈페이지·구매 안내·앱 지도에 쓰는 사진, 일러스트, 아이콘, 글꼴, 템플릿,
지도 타일과 정부기관 브랜드 자산에도 같은 원칙을 적용한다. `무료`, `공식`,
`Canva에서 제공`이라는 표시는 저작권 소멸이나 상업적 재사용 승인을 뜻하지
않는다. 이 문서는 법률 판단을 대신하지 않으며, 확인할 수 없는 권리는
발행하지 않는 운영 기준이다.

## 현재 public transport guide 상태

`/public-transport-guide`는 현재 교통기관·정부 페이지로 가는 외부 링크와
사용자가 직접 입력한 주거비·통학시간의 단순 계산만 제공한다. 시간표, 요금,
실시간 운행, 정류장, 범죄 통계 데이터셋을 수집·복사·캐시·재게시하지 않는다.
따라서 현 상태는 `NOT_COLLECTED`이며, 공식 원본의 갱신 시각이나 데이터셋
라이선스를 Hoju Compass의 갱신 시각·라이선스로 대신 표시하지 않는다.

## 홈페이지·구매 화면의 외부 자산 기본값

홈페이지 개편은 repo 안에서 직접 만든 레이아웃, 카피, CSS와 소유권을 확인한
자체 제작 시각 요소를 기본값으로 한다. Canva 템플릿을 사용했다는 이유만으로
허용 또는 금지를 단정하지 않지만, 제3자 템플릿의 고유한 구성·카피·그래픽을
그대로 복제하거나 최소 변경으로 Hoju Compass 자산처럼 배포하지 않는다.
Canva도 판매용 디자인은 독창적이어야 하고 라이브러리 콘텐츠의 독립 재판매는
허용하지 않는다고 안내하며, 라이브러리 요소의 권리는 디자인 제작자에게
자동 이전되지 않는다. 자체 디자인은 이 출처·권리·재사용 범위를 가장 명확히
유지하는 운영 선택이다.

외부 자산을 실제로 채택할 때는 발행 전에 아래 상태 전용 register 한 행이
필요하다. 라이선스 영수증·계정 화면·계약 원문처럼 계정이나 결제 정보가
포함될 수 있는 증거는 승인된 비공개 위치에 보관하고 repo에는 넣지 않는다.

| 필드 | 발행 계약 |
| --- | --- |
| `asset_ref` | 내부에서 중복되지 않는 비민감 참조값; 외부 계정·주문 ID 금지 |
| `public_location` | 자산이 보이는 페이지와 위치 |
| `asset_type` | 사진, 일러스트, 아이콘, 글꼴, 템플릿, 지도, 로고 중 하나 |
| `provider` / `source_url` | 실제 제공자와 해당 자산 또는 콘텐츠 정보 원문; 검색 결과 URL 금지 |
| `creator` | 원문에 표시된 제작자; 없으면 `unknown`이며 추정 금지 |
| `licence_name` / `licence_url` / `licence_version` | 사용 시점에 해당 자산에 적용된 정확한 조건 |
| `commercial_use` / `modification` | 홈페이지·유료 제품 홍보와 편집 사용 허용 여부 |
| `attribution_required` / `attribution_text` | 필요한 이름·출처·라이선스 링크·변경 표시의 공개 문구 |
| `restrictions` | 독립 사용, 템플릿 재배포, 인물·재산권, 상표, editorial-only 등 추가 제한 |
| `evidence_checked_at` / `private_evidence_ref` | 조건 확인 시각과 비밀값 없는 비공개 증거 참조 |
| `decision` | `APPROVED`, `ATTRIBUTION_REQUIRED`, `REVIEW_REQUIRED`, `PROHIBITED` 중 하나 |
| `owner` / `review_due_at` | 발행 승인 담당자와 조건 재확인 시점 |

- `APPROVED` 또는 공개 귀속이 같은 변경에 포함된 `ATTRIBUTION_REQUIRED`만
  발행한다. `REVIEW_REQUIRED`, 누락 필드, 서로 다른 라이선스 표시는 모두 HOLD다.
- `PROHIBITED`에는 출처를 복원할 수 없는 다운로드, 무단 복제 템플릿,
  commercial use가 불명확한 자산, editorial-only 자산의 판매 홍보 사용,
  허가 없는 정부 로고·문장 사용을 포함한다.
- `무료`는 가격 상태일 뿐 라이선스가 아니다. CC0/Public Domain 표시도 해당
  자산 원문에서 확인하고, 인물초상·상표·도덕적 권리 등 별도 권리를 자동으로
  해결했다고 가정하지 않는다.
- Canva를 쓰면 각 요소의 content source와 Free/Pro/Branded/Education 등급을
  사용 시점에 확인한다. 가장 제한적인 요소의 조건을 적용하고, Pro 요소를
  다른 디자인이나 독립 파일로 재사용할 권리 또는 Canva Education의 상업적
  사용 권리를 추정하지 않는다. 계정 등급이나 export 성공은 권리 증거가 아니다.

## 지도·정부 시각 자산 경계

- 데이터 포털의 라이선스는 개별 데이터셋 재사용 조건이지 기관 로고, 문장,
  지도 베이스맵, 사진이나 제3자 자료의 포괄 허가가 아니다. 각 자산을 별도
  register 행으로 심사한다.
- CC BY 4.0 자료는 제공자·원문·라이선스 링크와 변경 여부를 합리적으로
  표시하고, 그 표시로 제공자의 승인·제휴를 암시하지 않는다. 포털이나
  데이터셋이 별도 귀속 형식을 지정하면 그 형식을 우선한다.
- Commonwealth Coat of Arms와 정부기관 로고는 데이터 라이선스에서 제외된
  것으로 취급하고 별도 서면 권한 없이는 홈페이지 신뢰 배지로 쓰지 않는다.
  기관명 텍스트와 공식 원문 링크로 출처를 알리는 것으로 충분하다.
- Google Maps Platform 콘텐츠를 향후 페이지 안에 렌더링하면 제품별 정책에서
  요구하는 Google Maps와 제3자 제공자 귀속을 같은 컨테이너에서 가리지 않고
  유지한다. 현재처럼 외부 Google Maps 링크만 제공하는 것과 API 결과·지도
  타일을 복사·캐시·스크린샷으로 재게시하는 것은 다른 사용이다.
- 출처, 지도 타일 조건, 캐시·스크린샷 허용 범위 또는 귀속 문구 중 하나라도
  확인되지 않으면 `REVIEW_REQUIRED`로 두고, 지도 임베드 대신 공식 원문 링크와
  `NOT_COLLECTED` 상태를 유지한다.

## 첫 결제 전환의 공개 신뢰 카피 계약

신뢰 카피는 권리나 공식성을 새로 만드는 문구가 아니라, 이미 확인된 사실을
짧게 공개하는 장치다. 홈페이지 유료 CTA 근처에는 제품명·한 번 결제·전달
방식·제품 지원·환불 안내 링크를 기존 구매정보와 같은 의미로 제공한다. 외부
자료를 가치 근거로 내세울 때는 다음 두 문장을 register와 데이터 상태가
뒷받침하는 범위에서만 쓴다.

> 공식 원문을 다시 확인할 수 있도록 출처와 마지막 확인일을 표시합니다.
> 계산·요약은 Hoju Compass의 설명이며 해당 기관의 공식 앱·제휴·승인을
> 뜻하지 않습니다.

외부 자산을 실제 사용하고 공개 귀속이 필요할 때는 같은 화면이나 한 번의
명확한 링크로 `제작자/기관 · 자산/데이터셋 제목 · 출처 · 라이선스 · 변경함/안
함`을 제공한다. 출처가 없거나 register가 HOLD인 상태에서 `공식 데이터 기반`,
`정부 승인`, `라이선스 완료`, `저작권 문제 없음`, `실시간`, `최신`을 쓰지
않는다. 첫 결제 전환 성과는 이 경계를 낮추는 근거가 아니다.

## 데이터 항목별 필수 필드

향후 공식 데이터에서 값·목록·점수·지도·추천을 만들기 전에는 각 데이터셋별로
아래 필드를 모두 가져야 한다. 값이 없으면 `unknown`을 명시하고 CURRENT로
보이지 않는다.

| 필드 | 공개·운영 계약 |
| --- | --- |
| `source_name` | 데이터 관리 정부기관·교통기관 이름 |
| `source_url` | 값을 뒷받침하는 데이터셋/metadata 원문 URL; 일반 홈페이지로 대체 금지 |
| `source_record_title` | 사용한 데이터셋·API·문서의 정확한 제목 |
| `source_updated_at` | 원본 metadata의 갱신 시각; 없으면 `unknown`이며 수집 시각으로 추정 금지 |
| `collected_at` | Hoju Compass가 원본을 성공적으로 받은 UTC 시각; 원본 갱신 시각과 별도 |
| `expected_refresh_interval` | 원본 metadata 또는 운영 계약에 근거한 예상 갱신 주기 |
| `data_status` | `CURRENT`, `STALE`, `NOT_COLLECTED`, `SOURCE_UNAVAILABLE`, `ERROR` 중 하나 |
| `licence_name` / `licence_url` | 그 데이터셋에 실제 표시된 라이선스와 원문; 포털 기본값 추정 금지 |
| `attribution_text` | 데이터셋 조건에 맞는 기관 귀속; 로고·상표 사용 권리로 확대 금지 |
| `transformation_summary` | 필터·집계·단위 변환·결측치 처리처럼 Hoju Compass가 한 작업 |
| `hoju_interpretation` | 원본 사실과 분리된 자체 설명·점수·추천 여부 및 한계 |
| `limitations` | 지연·누락·지역/기간 범위·신고/집계 편향·적합성 한계 |
| `error_report_path` | `/contact`의 콘텐츠 정정 경로 |

## 공개 상태 규칙

- `CURRENT`는 `source_updated_at`, `collected_at`, 예상 갱신 주기와 라이선스가
  모두 확인되고 현재 시각이 허용된 freshness window 안일 때만 쓴다.
- `FRESHNESS_UNKNOWN`은 공식 API 응답을 받았더라도 원본 `source_updated_at` 또는
  예상 갱신 주기를 확인하지 못한 상태다. `CURRENT`로 올리지 않고, 확인 시각과
  공식 원문 재확인 안내를 같은 화면에 표시한다.
- `STALE`이면 마지막 값의 날짜와 오래됐다는 경고를 같은 화면에 표시하고,
  실시간·현재·최신 또는 안전 추천으로 표현하지 않는다.
- `NOT_COLLECTED`이면 숫자·순위·지도·추천을 “공식 데이터 기반”으로 표시하지
  않는다. 공식 링크와 사용자가 직접 확인할 항목만 제공할 수 있다.
- `SOURCE_UNAVAILABLE` 또는 `ERROR`이면 이전 성공 값을 조용히 최신처럼
  재사용하지 않는다. 현재 확인 불가, 마지막 성공 시각과 공식 원문 링크를
  표시하고 안전·계약·비용 결정을 유도하는 결과는 숨기거나 중립화한다.
- 출처 값에는 `공식 출처`, 변환·계산·요약에는 `Hoju Compass 해석`을 각각
  표시한다. 기관 로고나 “공식 앱” 표현으로 승인·제휴를 암시하지 않는다.

## 라이선스·정정·개인정보 경계

라이선스는 데이터셋별 metadata에서 확인한다. 예를 들어 Transport for NSW
Open Data Hub는 별도 표시가 없으면 CC BY 4.0과 기관 귀속을 안내하지만,
데이터셋·브랜드 자산마다 조건이 다를 수 있다. Victorian transport dataset도
개별 metadata에 라이선스·갱신 시각·주기를 표시한다. 단순 링크는 데이터
재게시나 라이선스 승계를 뜻하지 않는다.

오류 신고에는 페이지 주소, 확인이 필요한 문장/값, 확인 시각, 공식 원문 URL,
원문에 표시된 갱신일·라이선스만 요청한다. 정확한 집 주소, 이동 이력, 계정,
티켓·카드 정보, 신분증, 전체 화면 캡처는 요구하지 않는다. 오류 신고는
Hoju Compass 콘텐츠 정정 접수이며 정부기관을 대신한 민원·긴급 신고가 아니다.

공식 참고:

- Canva Content License Agreement: https://www.canva.com/policies/content-license-agreement/
- Canva Intellectual Property Policy: https://www.canva.com/policies/intellectual-property-policy/
- Canva Help, Use Canva to design products for sale: https://www.canva.com/help/using-canva-to-create-products-for-sale/
- Creative Commons Attribution 4.0: https://creativecommons.org/licenses/by/4.0/
- Data.gov.au copyright and dataset attribution: https://www.data.gov.au/data/about
- Commonwealth Coat of Arms guidance: https://www.pmc.gov.au/honours-and-symbols/commonwealth-coat-arms
- Transport for NSW Data Licence: https://opendata.transport.nsw.gov.au/datalicence
- Victorian Public Transport Lines and Stops metadata: https://discover.data.vic.gov.au/dataset/public-transport-lines-and-stops
- NSW Standard for Data Quality Reporting: https://data.nsw.gov.au/sites/default/files/inline-files/NSW%20Standard%20for%20Data%20Quality%20Reporting%20v1.2%20FINAL_0.pdf
- Google Maps Platform attribution requirements: https://developers.google.com/maps/documentation/geolocation/policies
