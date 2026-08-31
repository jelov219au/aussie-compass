# 작은 화면의 검사 지역명 표시

2026-08-31. 호환성: **주의사항과 함께 호환**.

## 범위

기존 모바일 점검에서 남긴 ACT 지역명 잘림을 후속 처리했다.
320px Chrome에서 닫힌 native select는 `ACT · Australian Capital Territory`의
끝부분을 잘라 표시한다. 선택기 자체의 OS 렌더링을 대체하지 않고, 바로 아래
공용 결과 카드에 기존 데이터의 전체 지역명을 줄바꿈 가능한 텍스트로 표시한다.
웹·모바일·설치형 PWA 모두 같은 `VehicleInspectionProviderPicker`를 사용한다.

선택 항목, label, 상태, aria-live 영역, 원본 데이터, 제공자 링크, 검사 범위,
NSW/ACT 주의사항 및 외부 사이트 복귀 안내는 바꾸지 않았다. 기기 설치,
저장값·스키마·권한·결제·gate·provider·env·서비스 워커 변경은 없다.

## 확인

- 기존 공개 화면에서 ACT를 선택해 잘림 재현. 지역 선택은 메모리 상태이며
  비교표 입력값은 편집하지 않았다. 공개 선택값을 미선택으로 되돌렸다.
- 전체 lint와 Production build/TypeScript/141개 정적 페이지 생성 통과.
- 기존 mobile-pwa-usability, core-accessibility, cross-surface-content 검사 통과.
  사소한 표시 변경을 복제하는 새 테스트는 만들지 않았다.
- 수정본 Production 빌드를 loopback127.0.0.1:3218에서 기존 Chrome 연결로 확인.
- 320×568: 8개 지역의 전체 이름이 결과 카드에서 잘림 없이 표시됨. 각 지역당
  외부 CTA 하나와 높이48px 유지. ACT 전체 이름은 높이48px의 두 줄이며,
  native select 높이48px와 visual and non-mechanical 주의 문구 유지.
- ACT의 전체 이름은 768×1024, 1440×900에서 높이24px의 한 줄로 표시됨.
  세 화면 clientWidth/scrollWidth는305/305,753/753,1425/1425px.
- 미선택 복귀 시 결과 카드 제거됨. 브라우저 error/warn 로그 없음.
- 점검 탭을 닫고 viewport를 복구했으며 자체 loopback 서버를 종료함.

## 근거와 한계

스크린샷 폴더:
`C:/Users/jelov/.codex/visualizations/2026/08/31/01a0564f-8139-7362-a82a-4432cc963ce9/`

- `inspection-region-before-320.png`: 기존 공개 화면.
- `inspection-region-after-320.png`, `inspection-region-after-768.png`,
  `inspection-region-after-1440.png`: 로컬 수정본.

닫힌 native select 자체의 표시 폭은 그대로다. 전체 이름은 인접한 결과 카드에서
확인할 수 있다. 실제 iPhone/Android의 native select, 스크린 리더 및 설치형 PWA
실행은 이 데스크톱 Chrome 검사로 통과 처리하지 않는다. 외부 예약은 실행하지 않았다.

기준 main은60e0e09883b4ee93af2dd0489b2d1a9d007abe77. 격리 cc24 checkout만
수정했고 다른 작업과 기존 untracked 첨부/점검 기록은 보존했다. 이번 후속 요청에서는
로컬 수정·검증·커밋만 진행하며 추가 Production 배포나 remote push는 하지 않는다.
