# Local conversion-route performance evidence — 2026-08-23

This evidence was captured from commit `34fd6e8` before the urgent first-sale gate work began. It is diagnostic only; no external Lighthouse service or production mutation was used.

| Route | Compressed HTML | Compressed initial JS | Compressed CSS | Initial total |
| --- | ---: | ---: | ---: | ---: |
| `/resume-builder` | 10,810 B | 192,499 B | 14,078 B | 217,387 B |
| `/resume-pro` | 17,171 B | 185,421 B | 14,078 B | 216,670 B |
| `/resources/english-resume-achievement-examples` | 21,617 B | 186,482 B | 14,078 B | 222,177 B |

Page-specific compressed JavaScript was approximately 15.7 KB, 8.8 KB and 9.8 KB respectively; shared chunks dominated. No webfont file was transferred and the only image asset was `icon.svg`.

At 390×844, all three pages had no horizontal overflow and their mobile menu became interactive. Navigation-to-load / menu-interactive measurements were 199/525 ms, 210/544 ms and 221/571 ms respectively in the local production server. The Resume Builder's first saved-value input occupied y=798–842 and was visible and enabled. Median local TTFB/total measurements were 4.8/5.3 ms, 20.5/25.3 ms and 9.4/11.4 ms.

Conclusion: no evidenced P0/P1 performance defect justified a conversion-risking change. The urgent first-sale concurrency gate superseded further performance optimization.
