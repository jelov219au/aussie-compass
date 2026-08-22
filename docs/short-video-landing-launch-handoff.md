# 2순위 짧은 영상 랜딩 · LAUNCH 전환 인수 문서

대상 자산: `공고 하나를 지원 묶음으로` 짧은 영상

대상 사용자: 호주 취업 공고를 하나 골랐고, AI 예시를 복사하는 대신 자신의 실제 경력으로 지원 자료를 준비하려는 한국어권 20~30대

목표 상태: 모바일 감사의 **HOLD**를 **LAUNCH**로 전환

범위: Resume Builder 첫 화면, 공식 출처 링크, 무료 완료 뒤 Resume Pro 연결, 영상 설명란

비범위: Checkout·가격 변경, Resume Pro 기능 변경, 외부 게시·광고 집행, 새 개인정보 수집

## HOLD 원인

현재 live `/resume-builder`는 무료 작성, 자동 저장, PDF와 백업 기능을 분명하게 제공한다. 하지만 짧은 영상이 약속하는 아래 흐름은 첫 화면에 보이지 않는다.

```text
공고 하나
→ 내가 설명할 수 있는 경력 근거
→ 이력서·커버레터·제출 전 체크리스트 묶음
```

또한 Resume Builder 안에서 Workforce Australia 공식 자료로 바로 이동할 수 없다. 영상 설명에서 `공식 항목 확인`을 약속하고 일반 Builder 화면으로 보내면 유입 약속과 랜딩 경험이 끊긴다.

## 구현 뒤 한 문장으로 설명할 상태

> 공고 하나를 골랐다면, 공식 항목을 확인하고 내 실제 경력을 무료로 저장한 뒤 필요한 경우에만 지원서 묶음으로 이어갈 수 있다.

## 첫 화면 최종 문구

아래 문구를 개발팀 구현 기준 원문으로 사용한다. 유사 표현으로 바꾸지 않는다.

### Eyebrow

> 지원할 공고가 생겼을 때

### H1

> 공고 하나를 골랐다면, 내 실제 경력부터 맞춰보세요.

### 설명

> 공고 문장을 그대로 복사하지 않고, 내가 실제로 한 일을 먼저 무료 이력서에 저장해요. 기본 이력서와 PDF 저장까지 무료예요.

### 3단계 메시지

| 순서 | 짧은 제목 | 보조 문구 |
| --- | --- | --- |
| 01 | 공고 하나 고르기 | 지원할 회사와 직무를 정해요. |
| 02 | 경력 근거 저장하기 | 면접에서 설명할 수 있는 경험만 적어요. |
| 03 | 필요한 경우만 지원 묶음 | 회사별 이력서·커버레터·체크리스트로 이어가요. |

3단계는 `공고 → 경력 → 결과물` 순서를 바꾸지 않는다. 03에서 `구매`, `결제`, `Pro 시작`을 말하지 않는다.

## 첫 화면 정보 순서

390px 모바일에서 다음 순서를 그대로 유지한다.

1. Header
2. Eyebrow
3. H1
4. 설명
5. 3단계 메시지
6. 무료 Primary CTA
7. 공식 출처 Secondary link
8. Resume Builder 입력 영역 시작

Resume Pro 가격, Checkout CTA와 구매 조건은 첫 화면에 넣지 않는다.

## 무료 CTA

### Primary CTA 문구

> 내 실제 경력 무료로 저장하기

### 동작

- 같은 페이지의 첫 필수 입력인 `이름` 또는 Builder 입력 영역 시작점으로 스크롤한다.
- 새 페이지를 열지 않는다.
- 클릭 전 회원가입, 이메일, 결제수단 또는 개인정보 동의를 요구하지 않는다.
- 버튼 아래에 `입력 내용은 현재 브라우저에 자동 저장됩니다.`를 표시한다.

### 시각 우선순위

- 첫 화면의 유일한 채움형 버튼으로 표시한다.
- 390px에서 가로 전체를 사용하고 높이는 최소 48px로 한다.
- 공식 출처는 테두리 없는 텍스트 링크로 두어 Primary CTA와 경쟁하지 않게 한다.
- Resume Pro CTA는 이 영역에 표시하지 않는다.

## 공식 출처 위치와 문구

공식 출처는 무료 Primary CTA 바로 아래, 입력 영역보다 위에 둔다.

### 링크 문구

> 공식 항목 확인: Workforce Australia Resume planner ↗

### 보조 설명

> 이력서에 정리할 경력·기술·교육·자격 항목을 원문에서 확인해요.

### URL

```text
https://www.workforceaustralia.gov.au/content/online-learning/course/what-needs-to-be-in-your-resume/assets/Resume%20planner.pdf
```

### 표현 제한

- `호주 정부 표준 이력서`, `공식 양식`, `정부 인증`이라고 부르지 않는다.
- Workforce Australia가 Hoju Compass나 Resume Pro를 추천한다는 인상을 주지 않는다.
- 새 탭에서 열고 외부 사이트 이동임을 `↗`로 표시한다.
- 공식 링크가 열리지 않으면 출처 영역을 숨기지 말고 랜딩 배포를 보류한다.

성과 문장에 대한 Fair Work 자료는 첫 화면에 추가하지 않는다. 출처가 여러 개 보이면 무료 CTA가 약해지므로 기존 성과 문장 글에서 보조 근거로 유지한다.

## 무료 결과물 완성 기준

사용자는 결제 없이 다음을 끝낼 수 있어야 한다.

- 필수 내용 7/7 작성
- 브라우저 자동 저장
- 이력서 미리보기
- 무료 PDF 저장
- 텍스트 복사
- 작성본 백업과 불러오기

필수 내용이 7/7이 되기 전에는 기존 `인쇄 · PDF 저장`, 텍스트 복사와 백업 기능을 가리지 않는다. Pro 전환을 위해 무료 기능을 축소하거나 순서를 늦추지 않는다.

## Resume Pro 노출 시점

Resume Pro는 필수 내용 7/7 완료 뒤 나타나는 `기본 이력서 준비 완료` 영역에서만 주요 선택지로 노출한다.

### 완료 영역 제목

> 기본 이력서를 무료로 완성했어요.

### 완료 영역 설명

> 지금 만든 이력서는 PDF로 저장하고 다음 지원에도 다시 쓸 수 있어요. 실제 지원할 공고가 있다면 같은 경력을 회사별 지원 자료로 이어갈 수 있어요.

### 선택지 순서

1. 무료 Primary: `무료 PDF로 저장하기`
2. Pro Secondary: `이번 공고 지원 묶음 확인하기`

390px에서는 두 선택지를 세로로 쌓고 무료 PDF를 위에 둔다.

### 가격 노출 문구

Pro Secondary 안이나 바로 아래에서 한 번만 표시한다.

> Resume Pro · A$19.90 1회 · 구독 없음

### 가격 노출 금지 위치

- 영상 제목과 썸네일
- 영상 첫 20초 화면
- 랜딩 H1과 설명
- 랜딩 첫 390×844 화면
- 무료 입력 7/7 완료 전 고정 배너·팝업

### Pro 보조 문구

> 회사별 이력서·커버레터·제출 전 체크리스트가 필요할 때만 이용하세요. 없는 경력이나 취업 결과를 만들어주지는 않아요.

## 유입과 Pro 연결

### Builder 유입 URL

```text
https://hojucompass.com/resume-builder?from=launch-youtube&utm_source=youtube&utm_medium=video&utm_campaign=resume-pro-action-14d-202608&utm_content=job-pack-short-b
```

### 완료 뒤 Pro URL

```text
https://hojucompass.com/resume-pro?from=launch-youtube&utm_source=youtube&utm_medium=video&utm_campaign=resume-pro-action-14d-202608&utm_content=job-pack-short-b-pro
```

### 추적 안전 조건

- Builder는 `launch-youtube`처럼 미리 허용한 `from` 값만 다음 단계로 전달한다.
- 허용하지 않은 `from`은 `direct`로 처리한다.
- 이름, 이메일, 회사명, 공고명, 입력한 경력과 검색어 원문을 URL이나 분석 이벤트에 넣지 않는다.
- Resume Builder 입력값과 UTM을 묶어 서버로 보내지 않는다.
- 페이지 조회 분석에서는 기존 개인정보 안내대로 쿼리 원문을 제거한다.

## 영상 설명란 최종 문안

아래 순서와 줄바꿈을 유지한다.

> 공고 문장을 그대로 붙이지 말고, 내가 실제로 설명할 수 있는 경력을 먼저 무료로 저장하세요. 기본 이력서와 PDF 저장까지 무료입니다.
>
> 1. 내 실제 경력 무료로 저장하기
>
> https://hojucompass.com/resume-builder?from=launch-youtube&utm_source=youtube&utm_medium=video&utm_campaign=resume-pro-action-14d-202608&utm_content=job-pack-short-b
>
> 2. 공식 Resume planner 확인하기
>
> https://www.workforceaustralia.gov.au/content/online-learning/course/what-needs-to-be-in-your-resume/assets/Resume%20planner.pdf
>
> 3. 성과 문장 예시와 확인 기준 보기
>
> https://hojucompass.com/resources/english-resume-achievement-examples?utm_source=youtube&utm_medium=video&utm_campaign=resume-pro-action-14d-202608&utm_content=job-pack-short-b-guide
>
> 실제 공고에 낼 회사별 이력서·커버레터·제출 전 체크리스트가 필요할 때만 Resume Pro를 확인하세요. A$19.90 1회 결제이며 구독은 없습니다.
>
> https://hojucompass.com/resume-pro?from=launch-youtube&utm_source=youtube&utm_medium=video&utm_campaign=resume-pro-action-14d-202608&utm_content=job-pack-short-b-pro

링크 순서는 `무료 Builder → 공식 원문 → 무료 설명 글 → Pro`로 고정한다. Pro 링크를 첫 번째 링크나 고정 댓글의 단일 링크로 쓰지 않는다.

## 영상 마지막 화면 최종 문구

### 화면 문구

> 공고가 있다면, 내 실제 경력부터 무료로 저장하세요.

### CTA

> 무료 이력서 만들기

### 표시하지 않을 내용

- A$19.90
- 결제 버튼 이미지
- `지금 구매`, `마감`, `한정`, `합격`, `자동 완성`
- 실제 사람의 이력서·회사명·연락처

## 390px 모바일 Acceptance Criteria

### AC-01 · 첫 화면 메시지

**Given** 공개 `/resume-builder`를 390×844로 연다.

**When** 페이지가 로드된다.

**Then** 스크롤하지 않고 Eyebrow, H1, 설명, 3단계, 무료 Primary CTA와 공식 출처 링크를 모두 읽고 누를 수 있다.

### AC-02 · 무료 우선순위

**Given** 필수 내용이 0/7이다.

**When** 첫 화면을 본다.

**Then** 채움형 Primary 버튼은 `내 실제 경력 무료로 저장하기` 하나뿐이며 Resume Pro 가격·구매·Checkout CTA는 보이지 않는다.

### AC-03 · 레이아웃

**Given** viewport width가 390px이다.

**When** 첫 화면과 Builder 전체를 세로로 이동한다.

**Then** 가로 스크롤이 없고 `document.documentElement.scrollWidth`가 390px를 넘지 않는다.

### AC-04 · 읽기와 터치

**Given** 390px 모바일이다.

**When** CTA와 공식 링크를 확인한다.

**Then** 주요 본문은 16px 이상, CTA·링크 터치 영역은 높이 44px 이상이며 텍스트가 잘리거나 겹치지 않는다.

### AC-05 · 공식 출처

**Given** 첫 화면의 공식 출처 링크가 보인다.

**When** 링크를 선택한다.

**Then** Workforce Australia Resume planner가 새 탭에서 열리고 현재 Builder 입력 내용은 유지된다.

### AC-06 · 무료 입력 시작

**Given** 첫 화면의 무료 CTA가 보인다.

**When** `내 실제 경력 무료로 저장하기`를 선택한다.

**Then** 같은 페이지의 첫 필수 입력으로 이동하며 로그인·결제·이메일 요구가 나타나지 않는다.

### AC-07 · 무료 결과 완결

**Given** 사용자가 필수 내용 7/7을 작성했다.

**When** 완료 영역이 나타난다.

**Then** `무료 PDF로 저장하기`가 첫 번째 선택이고 PDF·텍스트 복사·백업 기능을 결제 없이 사용할 수 있다.

### AC-08 · Pro 가격 노출

**Given** 필수 내용이 7/7 미만이다.

**Then** Resume Pro 가격은 보이지 않는다.

**Given** 필수 내용이 7/7이다.

**Then** `Resume Pro · A$19.90 1회 · 구독 없음`이 완료 영역에서 한 번만 보인다.

### AC-09 · Pro 연결 문구

**Given** 완료 영역이 보인다.

**When** Pro 선택지를 읽는다.

**Then** 회사별 이력서·커버레터·제출 전 체크리스트의 범위와 `없는 경력·취업 결과를 만들지 않음`이 함께 표시된다.

### AC-10 · 유입값

**Given** Builder에 `from=launch-youtube`로 들어왔다.

**When** 7/7 완료 뒤 Pro를 연다.

**Then** Resume Pro URL의 `from`은 `launch-youtube`이고 이름·회사·공고·경력 입력값은 URL과 분석 이벤트에 없다.

### AC-11 · 직접·다른 채널 유입

**Given** Builder에 허용되지 않은 `from`이나 개인 데이터처럼 보이는 쿼리가 들어왔다.

**When** Pro 연결이 생성된다.

**Then** 해당 값은 전달되지 않고 `direct`로 처리된다.

### AC-12 · 신뢰 안내

**Given** Pro 선택지가 나타난다.

**Then** A$19.90, 1회 결제, 구독 없음이 일치하고 Resume Pro 랜딩에서 구매·환불·개인정보 안내 링크를 확인할 수 있다.

### AC-13 · 상태 보존

**Given** 사용자가 Builder에 내용을 입력했다.

**When** 공식 출처를 새 탭에서 열었다가 Builder로 돌아오거나 새로고침한다.

**Then** 입력 내용이 현재 브라우저에 남아 있다.

### AC-14 · 접근성

**Given** 키보드 또는 스크린리더를 사용한다.

**When** 첫 화면부터 입력 영역까지 이동한다.

**Then** H1은 하나이고 3단계는 순서 있는 목록이며 CTA, 외부 링크와 완료 영역에 명확한 접근 가능한 이름이 있다.

### AC-15 · 기존 무료 기능 회귀 없음

**Given** 변경 전 Resume Builder 기능을 기준으로 한다.

**Then** 자동 저장, 미리보기, PDF, 텍스트 복사, 백업·불러오기, 디자인 선택과 예시 문장은 그대로 동작한다.

## LAUNCH 판정 게이트

다음을 모두 통과하면 2순위 자산을 **LAUNCH**로 변경한다.

- AC-01부터 AC-15까지 모두 통과
- 390×844 실제 모바일 브라우저 스크린샷 검수 완료
- Workforce Australia 공식 링크 정상 도달
- 무료 PDF와 백업 동작 확인
- `launch-youtube` 유입이 Resume Pro까지 허용값으로 연결됨
- Resume Pro 판매 상태와 A$19.90 1회·구독 없음 확인
- Checkout을 시작하지 않고도 구매·환불·개인정보 안내에 도달 가능
- 콘솔 오류와 가로 스크롤 없음

하나라도 실패하면 **HOLD**를 유지한다. 특히 공식 출처 링크 오류, 무료 결과물 방해, 가격 조기 노출, 유입값에 개인정보 포함, 결제 뒤 접근 실패는 부분 승인하지 않는다.

## 개발팀 인수 체크리스트

- [ ] 첫 화면 최종 문구를 그대로 반영
- [ ] 3단계 순서와 무료 Primary CTA 반영
- [ ] 공식 출처를 CTA 아래·입력 영역 위에 배치
- [ ] 가격을 7/7 완료 뒤 한 번만 표시
- [ ] 모바일 완료 선택지를 무료 PDF → Pro 순서로 세로 배치
- [ ] 허용된 `launch-youtube`만 Pro로 전달
- [ ] 390×844에서 AC-01~15 검수
- [ ] live 배포 뒤 동일 URL로 모바일 재감사

이 문서는 구현 인수 기준만 정의한다. 코드 수정, 외부 게시·발송과 광고 집행은 포함하지 않는다.
