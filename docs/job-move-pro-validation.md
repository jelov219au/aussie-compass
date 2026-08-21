# Job Move Pro 제품 검증안

검토일: 2026-08-21  
상태: 기능 개발 전 가설 검증  
기존 제품명: Resume Pro  
가칭: Job Move Pro

## 1. 문제 정의

Resume와 Cover Letter 생성만으로는 A$19.90의 강한 구매 이유를 만들기 어렵다.

- 한인잡은 간단한 Resume와 대면·전화 면접만 요구하는 경우가 많아 Cover Letter 수요가 낮다.
- 영어가 부족한 구직자에게 더 시급한 문제는 낮은 시급, 불명확한 고용형태, 근무기록과 Payslip 부재일 수 있다.
- 체계적인 회사에 지원할 사람은 이미 일반 문서 도구나 AI를 사용할 가능성이 있다.
- 따라서 제품은 영어 문장을 대신 쓰는 것이 아니라, **한국 경력을 호주 채용에서 증명하고 더 나은 직장으로 이동할 판단을 돕는 결과물**을 제공해야 한다.

## 2. 구매 가능성이 높은 세 가지 상황

### A. 한인잡에서 정식 채용 절차가 있는 직장으로 이동

- 현재 상태: 호주 경력은 있지만 간단한 업무만 적힌 Resume를 사용한다.
- 실패 지점: 한국·한인잡 경력이 현지 공고의 Selection criteria와 어떻게 연결되는지 설명하지 못한다.
- 원하는 결과: 실제 경력을 과장하지 않고 공고별 근거 문장과 면접 사례로 정리한다.
- 지불 이유: 단순 번역이 아니라 다음 단계의 직장에 제출할 Application evidence가 완성된다.

### B. 한국의 실제 경력을 호주에서 다시 사용

- 현재 상태: Office, Trade, Technical, Professional 경력이 있지만 직책명·업무 범위가 호주식 표현과 다르다.
- 실패 지점: 직역한 Resume가 공고의 기대 수준과 맞지 않거나, 면접에서 경력 깊이를 보여주지 못한다.
- 원하는 결과: 한국 경력의 업무·규모·성과·도구·책임을 호주 채용 담당자가 검증 가능한 형태로 이해한다.
- 지불 이유: 일반 AI가 모르는 본인의 경력 구조를 질문으로 끌어내고, 없는 경험을 만들지 않는다.

### C. 두 개 이상의 공고·Offer 중 더 나은 이동을 결정

- 현재 상태: 시급만 보고 지원하거나 합격 후 고용조건을 비교하기 어렵다.
- 실패 지점: Casual loading, Super, 예상시간, 이동시간, 로스터 안정성, 성장 가능성을 함께 보지 못한다.
- 원하는 결과: 공고와 Offer의 조건·경력 가치·생활 영향을 한 화면에서 비교한다.
- 지불 이유: 문서 한 장보다 잘못된 직장 이동을 피하는 결정 가치가 크다.

## 3. 차별화 기능 후보

| 후보 | 고객 결과 | 일반 Resume/AI 대비 차이 | 우선순위 |
|---|---|---|---|
| 한국 경력 Evidence Mapper | 공고 요구조건마다 실제 사례 연결 | 번역이 아니라 근거 구조화 | 1 |
| Job Ad Reality Check | 역할·필수조건·모호한 표현·확인점 분리 | 키워드 복사 대신 사실 확인 | 1 |
| Interview Evidence Builder | STAR 사례와 후속 질문 준비 | 일반 답변 암기 대신 본인 사례 | 1 |
| Offer & Job Quality Compare | 임금·시간·안정성·성장 비교 | Resume 범위를 넘어 이동 판단 지원 | 2 |
| Application Pack | Resume·선택적 Cover Letter·체크리스트 | 앞 기능의 결과를 제출 형태로 묶음 | 2 |
| Cover Letter Generator | 요구되는 공고에서만 초안 생성 | 단독 핵심 기능으로 사용하지 않음 | 3 |

## 4. 심화된 면접 질문 기능

이 기능의 목적은 초급 영어 문장을 제공하는 것이 아니다. 공고와 회사, 지원자의 경력을 분석해 **좋은 답변을 준비하고 직장의 실제 모습을 확인할 질문**을 고르는 것이다.

### 역할의 실제 업무 확인

- “What would a typical day or shift look like in this role?”
- “Which responsibilities would you expect me to handle independently in the first three months?”
- “The job ad mentions [requirement]. How is that used in the day-to-day work?”
- “What usually makes someone successful in this role after the first three months?”

### 채용 배경과 팀 확인

- “Is this a newly created role, or am I replacing someone?”
- “What are the main challenges the team would like the new person to solve?”
- “Who would I work with most closely, and who would I report to?”
- “How is work normally divided during busy periods?”

### 교육과 경력 이동 확인

- “What does the onboarding or initial training normally include?”
- “Which skills would you expect me to develop over the first six to twelve months?”
- “How do people in this role usually take on more responsibility?”
- “How and when is performance reviewed?”

### 근무 현실 확인

- “What have the typical weekly hours been for this role over the last three months?”
- “How far in advance are rosters normally confirmed?”
- “How often do shifts change or get cancelled at short notice?”
- “Are weekend, evening or public holiday shifts a regular part of the role?”
- “Is travel between locations expected, and how often?”

### 지원자의 경력을 연결하는 질문

- “Based on my background in [experience], which part would be most useful to your team?”
- “Is there any part of my experience you would like me to explain in more detail?”
- “My previous role used [system/process]. What does your team use for the same work?”
- “Would an example of how I handled [relevant situation] help clarify my experience?”

### 생성 규칙

- 공고에 이미 답이 적힌 질문은 제외한다.
- 질문은 최대 4개만 추천한다.
- 합격 가능성을 높이는 질문 2개와 직장 품질을 확인하는 질문 2개로 나눈다.
- 사용자의 실제 경력과 연결되지 않는 전문용어는 넣지 않는다.
- 시급·Super 같은 기본 조건은 인터뷰 단계와 공고 특성에 따라 별도 Offer 확인 목록으로 보낸다.
- 질문마다 ‘왜 이 질문을 하는지’와 답변에서 확인할 신호를 한국어로 설명한다.

## 5. 권장 첫 유료 결과물

### Job Application Evidence Pack

사용자가 공고 하나와 자신의 실제 경력을 넣으면 다음을 만든다.

1. 공고 요구조건을 Must-have / Nice-to-have / 확인 필요로 분리
2. 요구조건마다 실제 경력 근거 연결
3. Resume에 넣을 Evidence bullet 제안
4. 면접에서 사용할 본인 사례 3개
5. 맞춤 면접 질문 4개와 질문 이유
6. 부족한 조건과 절대 만들어내면 안 되는 내용 표시
7. 선택적으로 Resume PDF와 Cover Letter 초안 연결

핵심 판매 문구 후보:

> 영어를 대신 꾸며주는 도구가 아니라, 내가 실제로 해온 일을 공고에 맞게 증명하는 지원 준비 도구.

## 6. 무료와 Pro 경계

### 무료

- 기본 Resume 작성·PDF
- 최저임금·Award·Payslip·Underpayment 안내
- 공고 읽기 기본 체크리스트
- 일반 면접 질문 예시
- 비자·고용조건 공식 출처

### Pro

- 공고 하나와 개인 경력의 Evidence mapping
- 맞춤 Evidence bullet과 면접 사례
- 공고 기반 심화 질문과 답변 신호
- 회사별 Application Pack 저장
- Offer·직장 품질 비교
- 필요한 경우에만 Cover Letter 초안

법적 권리와 공식 정보는 계속 무료로 유지한다.

## 7. 기능 개발 전 인터뷰 질문

실제 워홀러·유학생·이직 준비자 3–5명에게 제품명을 먼저 설명하지 않고 질문한다.

1. 최근 지원했던 직장은 어떤 경로로 찾았나요?
2. 지원 과정에서 가장 오래 걸리거나 막혔던 단계는 무엇이었나요?
3. Resume, Cover Letter, 면접 준비 중 실제로 하지 않은 것은 무엇이며 왜 하지 않았나요?
4. 한국 경력을 영어로 설명할 때 가장 어려웠던 사례가 있나요?
5. 공고를 보고 내가 자격이 되는지 어떻게 판단했나요?
6. 면접 후 실제 업무나 조건이 예상과 달랐던 경험이 있나요?
7. 직장을 고를 때 시급 외에 비교했던 항목은 무엇인가요?
8. 현재 사용하는 AI·번역·Resume 서비스에서 부족했던 것은 무엇인가요?
9. 공고 하나를 기준으로 경력 근거와 면접 사례가 완성된다면 언제 사용할까요?
10. 이 결과물에 A$19.90을 내지 않을 가장 큰 이유는 무엇인가요?

## 8. Go / No-Go 기준

다음 조건을 만족할 때만 개발한다.

- 5명 중 최소 3명이 공고별 경력 연결을 실제 문제로 경험했다.
- 최소 2명이 완성된 Evidence Pack에 A$19.90 지불 의사를 구체적 지원 상황과 함께 표현했다.
- 일반 ChatGPT 프롬프트보다 안전하고 빠른 이유를 한 문장으로 설명할 수 있다.
- Cover Letter 없이도 제품 가치가 성립한다.
- 법적 권리 확인을 유료 기능 뒤에 숨기지 않는다.

조건을 충족하지 않으면 Resume Pro 기능 확장을 멈추고 Pay Evidence 또는 Offer Compare 쪽을 우선 검토한다.
