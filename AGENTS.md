<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Web and installable-app parity

Hoju Compass의 "앱"은 별도 네이티브 앱이 아니라 같은 Next.js 사이트를 홈 화면에 설치하는 PWA다. 새 기능·콘텐츠·아이디어는 기본적으로 데스크톱 웹, 모바일 웹, 설치형 PWA에서 같은 URL·공용 컴포넌트·공용 데이터 계약으로 제공한다. 앱 전용 또는 웹 전용 복제 구현을 만들지 않는다.

구현 전에 `docs/dual-surface-compatibility.md`의 호환성 검토를 수행하고 결과를 `호환`, `주의사항과 함께 호환`, `차단됨` 중 하나로 사용자에게 먼저 알린다. 플랫폼 API 차이로 동일 구현이 불가능하면 지원 범위, 사용자 영향, 안전한 대체 경로를 명시한 뒤 진행한다. 실제 홈 진입점이 필요한 기능은 컴포넌트 파일만 만들지 말고 `src/app/page.tsx` 또는 현재 홈에서 도달 가능한 탐색 경로에 연결한다.
