# Public government and transport data trust contract

Hoju Compass가 정부·교통기관 자료를 링크하거나 향후 데이터셋/API를 사용할
때 적용하는 공개 신뢰 경계다. 정부 출처라는 사실은 Hoju Compass 서비스가
공식·승인·보증된다는 뜻이 아니며, 원문 사실과 Hoju Compass의 계산·요약·
해석을 같은 문장이나 상태로 합치지 않는다.

## 현재 public transport guide 상태

`/public-transport-guide`는 현재 교통기관·정부 페이지로 가는 외부 링크와
사용자가 직접 입력한 주거비·통학시간의 단순 계산만 제공한다. 시간표, 요금,
실시간 운행, 정류장, 범죄 통계 데이터셋을 수집·복사·캐시·재게시하지 않는다.
따라서 현 상태는 `NOT_COLLECTED`이며, 공식 원본의 갱신 시각이나 데이터셋
라이선스를 Hoju Compass의 갱신 시각·라이선스로 대신 표시하지 않는다.

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

- Transport for NSW Data Licence: https://opendata.transport.nsw.gov.au/datalicence
- Victorian Public Transport Lines and Stops metadata: https://discover.data.vic.gov.au/dataset/public-transport-lines-and-stops
- NSW Standard for Data Quality Reporting: https://data.nsw.gov.au/sites/default/files/inline-files/NSW%20Standard%20for%20Data%20Quality%20Reporting%20v1.2%20FINAL_0.pdf
