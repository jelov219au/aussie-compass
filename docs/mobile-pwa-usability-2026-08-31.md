# Mobile / installed-PWA usability review — 2026-08-31

Compatibility: **주의사항과 함께 호환**. One shared Next.js route/component
implementation serves desktop web, mobile web and the installed PWA. Installation
and external-browser handoff differ by OS/browser. No native-only feature or
duplicate app implementation is introduced.

## Bounded changes

- Header: visible 메뉴/닫기 text beside the icon; 44px minimum-height actions;
  44px minimum width for short desktop navigation labels; Escape closes the
  mobile disclosure and returns focus to its trigger; a short viewport can
  scroll the menu. This is a navigation disclosure, not a modal/focus trap.
- Vehicle inspection: retain the eight-state/territory native selector and all
  existing provider facts, URLs and NSW/ACT non-mechanical limitations. Show
  only the chosen option; use a prominent 48px-minimum booking-entry link,
  explicit new-window label, online/return instructions and reload-state limits.
- Installation: a working manual-instructions anchor exists even without an
  install offer or JavaScript. Only show the native install action when the
  browser supplies it. Consume each offer once, guard rapid clicks, handle
  rejection/cancellation, restore focus, and remove event listeners on unmount.
  The manual anchor follows the existing reduced-motion CSS rather than forcing
  smooth scrolling from JavaScript.
- Install page: smaller narrow-screen title, two readable device instruction
  cards, direct official links, manual backup/restore entry, storage separation,
  purchase-restoration boundary, external return and network limitations.

## Official instruction checks

Directly checked on 2026-08-31; these links are also visible on `/install`:

- [Apple iPhone web app](https://support.apple.com/guide/iphone/iphea86e5236/ios):
  Safari Share (possibly within More), Add to Home Screen, Open as Web App, Add.
  Replaces the old link whose identifier was for the broader bookmarks guide.
- [Apple iPad web app](https://support.apple.com/guide/ipad/open-as-web-app-ipad8f1f7a29/ipados):
  Share, More, Add to Home Screen, Open as Web App, Add.
- [Google Chrome Android web app](https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid):
  menu, Install and create shortcut, Install; menu wording may vary by version.

Product-specific storage and offline statements follow
`docs/dual-surface-compatibility.md` and the unchanged service worker, not an
assumption that all PWAs work offline or share storage.

## Verification and limits

- `npm run test:mobile-pwa-usability`: real component handlers transpiled into an
  isolated Node harness with hook/event doubles. Covers menu toggle/Escape/link
  dismissal, all eight regions/reset, manual fallback, accepted/dismissed native
  offers, prompt/userChoice rejection, rapid double-click and listener cleanup.
  This is **not** browser, hydration, accessibility-tree or OS-install evidence.
- Twelve existing targeted contracts: core accessibility, cross-surface content,
  visual hierarchy, public data trust, remaining source review, Rental contract,
  Rental live status, Rental portfolio, Pay Evidence contract, product entitlement
  isolation, first-sale gate and document references.
- Full TypeScript without emit/incremental output; ESLint for the four edited
  TSX files and the added test; whitespace inspection.
- Actual connected browser baseline: 1280 × 720 desktop, no page-wide horizontal
  overflow on the used-car page. Production/browser evidence belongs in
  `CURRENT_STATE.md` against the final exact SHA, not a guessed deployment.
- **Not verified here:** 320/768/1440px rendering, physical iOS/Android,
  standalone installation, screen-reader announcements, OS back/app switch,
  storage transfer, offline/relaunch and native install dialogs. Do not label
  these PASS based on source checks or the desktop viewport.

## Preserved boundaries / next acceptance

Base includes Rental release `d4eb657d4b912c40f0c90f85aa6d3cb9c143c6bf` and
the published Pay Evidence preparation. No payment environment variable,
checkout, entitlement, first-sale gate, Rental workspace, local-storage schema,
service-worker cache, dependency or provider setting changes. No transaction,
lead collection, ranking sale or referral fee.

Next device acceptance: at 320/768/1440px, open/close the menu and reach every
entry; choose all regions without clipped text; follow an official link and
return; exercise manual install and cancellation on iOS/Android; verify installed
PWA relaunch/offline and manual backup with disposable, non-sensitive data.
Coordinate Rental recovery testing with its separate owner; do not manufacture
an entitlement or pay merely to test the UI.
