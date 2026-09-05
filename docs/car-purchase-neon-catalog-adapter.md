# 중고차 Neon Client 연결 어댑터 구현 결과

사용자 직접 재개 요청에 따른 한 가지 작업: 공개 Client API로 연결 수명,
실패 뒤 재사용 금지, timeout 뒤 늦은 결과 차단을 실제 구현했다.
정기 감독/부재 세션을 재개한 작업이 아니다.

## 구현

`src/lib/carPurchaseProNeonCatalogConnection.ts`의
`createCarNeonCatalogQuery`를 기존 readiness envelope의 query port에 주입할 수
있다. 매 호출마다 설치된 `@neondatabase/serverless`의 새 `Client`를 사용한다.
Pool, SDK 내부 socket, 전역 neonConfig 변경, process.env 자동 조회는 없다.
모듈을 import하거나 factory를 만드는 것만으로는 연결하지 않는다.

신뢰된 서버 설정에서 connectionString과 binding을 받으며 database/user가
binding의 databaseName/inspectionRole과 일치해야 한다. URL은 postgres 또는
postgresql, 명시된 user/password/database를 요구한다. URL 옵션은 sslmode의
require/verify-full만 허용한다. 다른 옵션은 검토 없이 전달하지 않는다.
이 검사는 provider/project/branch identity의 독립 확인이나 원격 접속 승인을
대신하지 않는다. 실제 endpoint mapping/credential은 이 변경에 포함하지 않았다.

연결 획득 제한은 5초이며 public connectionTimeoutMillis와 별도 앱 timer를
함께 적용한다. statement/query timeout 5초, lock timeout 1초,
idle-in-transaction timeout 5초, default_transaction_read_only=on을 설정한다.
per-client useSecureWebSocket=true를 사용한다. 기존 고정 SQL·파라미터 검사와
BEGIN/SET LOCAL/SELECT/ROLLBACK 순서는 catalog orchestration이 유지한다.

기존 destroy()의 동기 종료 가정은 제거했다.

- quarantine(): 앱 수준에서 즉시 추가 쿼리와 늦은 결과를 차단한다.
- close(): 공개 client.end()의 비동기 종료 확인을 기다린다. 정상 결과도 이
  확인 전에는 반환하지 않는다. 종료 오류나 오류 event는 실패다.
- 전체 10초 deadline이 지나면 실패를 반환하며 종료 확인이 없는 연결을
  성공/재사용 가능으로 취급하지 않는다. 실제 cleanup은 뒤에 끝날 수 있다.
- 획득 도중 중단한 경우 end를 먼저 요청하고, 늦게 connect가 완료되어도
  다시 end를 호출하여 그 연결을 반환하거나 사용하지 않는다.
- query 실패·idle error·예기치 않은 end·동시 execute·다른 AbortSignal은
  연결을 격리하고 종료한다. 모호한 실패 뒤에 새 SQL을 보내지 않는다.
- 이 어댑터가 query 오류에서 이미 격리한 경우 orchestration의 rollback
  시도도 차단된다. 실제 disconnect rollback은 DB 수용검증 대상이다.

클라이언트 end()의 완료는 드라이버가 제공하는 종료 확인이다. 앱의 Promise
거절이나 quarantine이 서버 쿼리의 즉시 중단을 증명한다고 표현하지 않는다.
종료가 계속 멈춰 있으면 실제 연결 해제 상태는 UNKNOWN이다.

## 검증

- `check-car-purchase-neon-catalog-connection.mjs`: 최종 48 checks PASS.
  새 어댑터의 입력/획득/실패/재사용 차단/late connect·query/close 오류·지연과
  종료 중 error event를 검증했다. 종료 중 오류를 실패로 보완했다.
- 같은 검사에서 실제 설치된 driver 1.1.0 Client를 public WebSocket constructor의
  메모리 전송 모형에 연결했다. 실제 Client connect/query/end, PostgreSQL wire
  파라미터 인코딩과 결과 디코딩, 정상/SQL오류/조회timeout/종료지연의 4개 연결을
  통과했다. 실제 네트워크·서버·SQL실행은 0이며 SQL parser/DB semantics의 시험이 아니다.
- 종료 계약이 바뀐 기존 `check-car-purchase-catalog-transaction.mjs`: 93 checks
  PASS. 비동기 종료 전 결과 보류, 종료 지연 deadline, late-close, quarantine
  실패 시에도 close 시도를 포함한다. 다른 완료된 fixture들은 반복하지 않았다.
- strict scoped ES2017 TypeScript (`--types node`) PASS, 변경 TS/JS lint PASS.
  전체 build/server/browser/설치/원격변경/배포/실결제/외부발송은 실행하지 않았다.
- 최초 가용 RAM은 node:os.freemem으로 4,863,716 KiB 확인, 256MB heap 순차 실행.
  WMI 메모리 조회는 현재 권한으로 거절되어 해당 값으로 대체했다.
- 추가 실제-driver 시험의 대기 조건이 직전 연결 상태와 겹친 문제 및 정상종료의
  Terminate frame/close 구분을 시험 모형에서 수정한 뒤 최종 48 checks PASS.

## 사용자 검수 및 실제 DB에서 남은 조건

웹/모바일/PWA 판정은 **주의사항과 함께 호환**이다. 공용 서버 경계이므로
화면별 복제 구현은 없으며, 현재 production/shared route에는 연결하지 않았다.

대상 Neon identity·검사 role/권한·endpoint/registry binding을 확인한 범위에서
실제 획득 실패, lock/statement timeout, 두 session 경합, disconnect rollback,
서버 query 종료, network partition, 늦은 connect, 종료 대기 상태를 검증해야 한다.
실제로 승인된 보고서/manifest와 앱 배포 환경의 WebSocket 지원도 확인해야 한다.
가격/상품생성/DB 스키마 변경/배포/판매 개시는 별도 기존 승인 범위다.
기존 유료도구의 실제 사용자 흐름·모바일/PWA·파일 입출력 검수도 미완료로 남는다.
키 원문이나 신규 키 입력은 요청하지 않았다.

## 보존 및 현재 작업 경계

- task: 01a06929-dd46-70e0-a466-27d701b59c2b
- 실제 task cwd: C:/Users/jelov/Documents/Codex/aussie-compass
- source cwd: C:/Users/jelov/Documents/Codex/aussie-compass/.worktrees/first-sale-state-copy-audit
- branch: codex/paid-tools-release-candidate-20260902
- base HEAD: c2a9be12bfcc1c268df9bff72c3313a6c881db8d
- 시작 source dirty: CLEAN. 기존 개발 담당 task는 대기, 요청을 전달한 task도 idle 확인.
- primary checkout: tracked dirty19 / untracked146, 사용자 변경 보존, 수정0.
- 현재 sandbox의 .git 및 ops는 쓰기 허용 대상이 아니므로 커밋/운영원장 수정은
  하지 않고 소스 변경과 이 기술 결과 파일을 기존 release에 보존한다.
- 자동화 수정/새 작업/subagent/worktree0. 기존 hoju-compass-7 PAUSED 유지.
- 다음 행동: 이 미커밋 변경을 검토·보존한 뒤 승인된 대상의 실제 DB 수용 및
  사용자 검수를 진행한다. 같은 모의검사를 반복하며 개발 완료로 표현하지 않는다.

임시 진단 복사본 정리 전 기록: 동일 task/cwd/branch/base HEAD에서
scripts/debug-car-neon-local.mjs를 이번 새 검사 파일로부터 생성했다. 사용자 파일이
아니며 진단용 추가출력 외 원본과 동일하다. 현재 dirty는 tracked3개
(transaction TS, transaction test, transaction doc) 및 새 adapter/test/result/debug다.
진단 결과는 위 최종 검증 설명과 원본 검사에 보존했다. 다음 행동은 이 진단
복사본 한 파일만 제거하고 구현·검사·결과 파일을 남기는 것이다.

후속 ACK: 중앙 운영 소유권이 01a069e2-322d-7d10-a1df-34fe59402f53으로
변경됨을 확인했다. 위 PAUSED 표현은 이 adapter 구현 당시의 기록이다.
현재 writer는 중앙 운영파일/자동화를 변경하지 않는다. 기존48/93검증과
실행파일hash를 대조했으며 재실행0. 최신 변경 목록과 상세기록 보관 결함 수정은
car-purchase-development-handoff-20260904.md를 따른다. 임시debug 복사본은
앞선 보존 기록 후 제거했고 현재 사용자 파일 삭제0이다.
