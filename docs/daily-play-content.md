# 호주 한 판 · 날짜별 콘텐츠 계약

`src/data/dailyPlay.ts`는 서버 전용 콘텐츠 목록이다. 화면은 `DailyPlay.tsx`, 검증·날짜·저장 계약은 `src/lib/dailyPlay.ts`, 공개 경계는 `/api/play/daily`에 분리했다. 새 문제를 추가할 때 화면 코드를 고치지 않는다. 여러 날 분량을 한 번 배포하면 게시일 전환에는 재빌드·스케줄 서버가 필요 없다. 새 원고를 저장소에 더 넣는 작업의 배포는 여전히 필요하다.

## 편집 절차

1. Sydney 게시일 하나당 퀴즈·단어 퍼즐·창작 선택 각 하나를 작성한다. 기존 set와 문항 ID를 재사용하거나 공개된 내용을 다른 문제로 교체하지 않는다.
2. 각 항목에 고유 `id`, 핵심 지식/상황을 나타내는 `topicKey`, `checkedAt`, `review`를 적는다. 사실형에는 원문 URL·기관명·확인일을 적고 정답/해설을 직접 대조한다. 창작형은 `creative: true`로 표시한다.
3. 같은 단어·핵심 사실·상황을 문장이나 보기 순서만 바꿔 신규로 세지 않는다. 기존 `playground.ts`의 14개 표현 및 `playMore.ts`의 8개 상황도 편집 검수 대상으로 확인한다. 단어는 대문자 영문 3–12자, `topicKey`는 `slang:소문자단어`로 고정한다.
4. `node scripts/check-daily-play.mjs`로 모든 콘텐츠의 날짜·ID·주제 중복·출처·정답 범위를 확인한다. 이 검사는 의미가 같은 내용을 다른 topicKey로 위장한 경우까지 자동 판단하지 않으므로 원고 검수가 필요하다.
5. 세 항목 모두 `reviewed`인 세트만 게시된다. 원문 확인이 부족하면 `draft`를 유지하고 부족분을 운영 기록에 적는다. 미래 세트와 초안은 API 응답과 클라이언트 번들에 포함하지 않는다.

## 공개·기록 동작

- API가 서버의 Australia/Sydney 날짜를 기준으로 선택한다. `date` 쿼리는 과거 다시 풀기에만 유효하며 미래 내용을 반환하지 않는다. Cache-Control/CDN 모두 no-store다.
- 자정 타이머는 Sydney의 다음 날짜 경계를 계산하므로 DST의 23/25시간 날짜를 처리한다. 탭 복귀·창 포커스·네트워크 복귀에서도 확인한다. 열어둔 세트는 보존하고 새 날짜 이동은 사용자가 선택한다.
- 비어 있는 날짜는 ‘새 세트 미준비’라고 표시한다. 과거 세트를 오늘의 새 세트로 순환하지 않는다. 기존 14개 표현 퀴즈의 날짜 순환은 별도 ‘연습’으로 명시한다.
- 저장 키 `hoju-compass-daily-play-v2`는 마지막 한 세트의 날짜, 세 문항 ID, 답, 퍼즐 진행만 보관한다. 다른 날짜/ID의 답은 복원하지 않는다. 기존 `hoju-compass-daily-quiz-v1`은 연습 퀴즈에서 그대로 읽으며 새 기능이 삭제하지 않는다.
- 손상된 동일 날짜 기록은 덮어쓰지 않는다. 사용자가 새 문제 기록을 지우면 저장을 다시 시도할 수 있다. 읽기/쓰기 실패에도 풀이와 해설은 제공한다.
- 웹·모바일·설치형 PWA는 같은 URL과 API를 사용한다. 새 세트 확인은 온라인 기능이다. 이미 열린 문제는 연결 실패에도 유지한다. 오프라인 재실행이나 기기 간 기록 동기화를 약속하지 않는다. 새 추적 이벤트는 없다.

## 초기 검수 분량

2026-09-11~2026-09-17, 7세트/21항목. 사실형 원문은 2026-09-11 확인했다. 아래는 짧은 근거 요약이며 문항/해설은 한국어로 새로 작성했다.

| 게시일 | 퀴즈 핵심 근거 | 단어 | 창작 상황 |
|---|---|---|---|
| 09-11 | [오리너구리는 알을 낳는 포유류](https://australian.museum/learn/animals/mammals/platypus/) | BIKKIE | 주말 마켓 가게 |
| 09-12 | [에뮤는 호주 토종 새 중 가장 키가 큼](https://australian.museum/learn/animals/birds/emu/) | ESKY | 미래 편지 |
| 09-13 | [커먼웜뱃의 앞니·어금니는 계속 자람](https://australian.museum/learn/animals/mammals/bare-nosed-wombat/) | SANGA | 말하는 여행 물건 |
| 09-14 | [쿠카부라의 웃음 같은 울음은 영역 알림](https://australian.museum/learn/animals/birds/laughing-kookaburra/) | CUPPA | 움직이는 창문 그림 |
| 09-15 | [슈퍼브금조는 자연·기계 소리를 흉내 냄](https://australian.museum/learn/animals/birds/superb-lyrebird/) | AVO | 가상의 아이스크림 맛 |
| 09-16 | [코알라의 서식지는 유칼립투스 숲](https://australian.museum/learn/animals/mammals/koala/) | CHOKKIE | 기념품의 비밀 |
| 09-17 | [리틀펭귄은 가장 작은 펭귄](https://australian.museum/learn/animals/birds/little-penguin-eudyptula-minor/) | BATHERS | 동네 벽화 |

단어 7개의 뜻·철자는 [Curtin University의 호주 표현 안내](https://www.curtin.edu.au/news/advice/from-avo-to-arvo-the-ultimate-guide-to-aussie-slang/)를 대조했다. 기존 퀴즈 14개/퍼즐 6개에 없는 표현이다. 실제 배포 여부와 날짜별 공개 상태는 ops의 `DAILY_PLAY_RELEASE_20260911.md`에 기록한다.
