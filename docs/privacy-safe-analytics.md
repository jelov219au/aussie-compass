# Privacy-safe website analytics

Hoju Compass uses Vercel Web Analytics for aggregate product decisions without advertising cookies.

## Data boundaries

- Every page-view URL has its query string and fragment removed before transmission.
- A homepage search sends only a predefined topic such as `tax`, `pay`, `housing`, or `other`.
- Search text, calculator inputs, resume content, email addresses, payment IDs, local storage, and checklist details are never included in custom events.
- Resume funnel events use only an allowlisted `surface`, anonymous page `context` or fixed acquisition `entry`. The entry is selected from a code-defined list rather than copied from an arbitrary query. Names, STAR text, company names, search terms, full URLs and URL queries are never read or sent.
- Navigation events contain only an allowlisted internal destination and a homepage section or route category.
- Share, save, install, and checkout events contain only a broad content or product category and the completed action. They never contain document content, page titles, payment values, or identifiers.

## Events

| Event | Properties | Decision it supports |
| --- | --- | --- |
| `Home Search` | `topic`, `entry` | Which subject areas need more prominent tools or guides |
| `Home Navigation` | `section`, `destination` | Which homepage entry points people use |
| `Route Plan Saved` | `stage`, `concern` | Which situations most often become a saved plan |
| `Route Recommendation Opened` | `destination`, `route` | Which recommendations work for each broad situation |
| `Pro Interest` | `product`, `entry` | Which homepage offer earns enough interest to improve next |
| `Page Shared` | `content`, `method` | Whether readers find a resource guide or the Job Ad checker useful enough to share; checker shares use the fixed `resume_job_ad_checker` value and never include pasted text |
| `Page Saved` | `content`, `action` | Whether readers use the local return-visit workflow |
| `App Install` | `entry`, `outcome` | Whether the install page leads to a prompt or manual instructions |
| `Resume Builder Started` | `surface`, `context` | Whether a visitor begins interacting with the free resume builder |
| `Resume Job Ad Sample Viewed` | `surface`, `context` | Whether a visitor opens the fixed fictional example result before using their own text |
| `Resume Job Ad Checked` | `surface`, `context` | Whether a visitor completes the local-only resume and Job Ad comparison |
| `Resume Pro CTA Clicked` | `surface`, `context` | Which fixed, anonymous page surface sends interest to Resume Pro |
| `Resume Pro Viewed` | `entry`, `checkout` | Which fixed entry reaches the offer and whether checkout was available |
| `Resume Pro Free Proof Opened` | `entry` | Whether a visitor starts the local-only Job Ad proof step from the offer; the fixed acquisition entry is used instead of resume or Job Ad text |
| `Resume Pro Launch Interest` | `entry`, `method` | Which fixed entry opens a launch-notice email draft or copies the fixed request text while checkout is closed; `method` is only `mailto` or `copy` and does not prove the message was sent |
| `Checkout Started` | `product`, `entry` | Whether product interest becomes a Stripe checkout attempt |

The properties are deliberately limited to two per event so their meaning stays stable and compatible with the standard Vercel custom-event limits.
The two resume funnel events also fire at most once per fixed event, surface and context during the current client session. Analytics failures are ignored so editing and navigation continue normally.

## Activation and review

1. In the Vercel project, open **Analytics** and enable Web Analytics.
2. Deploy the version containing `PrivacyFriendlyAnalytics`.
3. Confirm page views after the first real visit. Custom events require a Vercel plan that supports them; page views still work without custom events.
4. Review after at least two weeks instead of reacting to a small number of visits.

Suggested first review:

- Move a tool upward only when it repeatedly ranks near the top for both destination visits and relevant search topics.
- Add content when a topic receives meaningful search activity but has weak destination engagement.
- Treat `other` growth as a prompt to review the taxonomy, never as permission to collect raw queries.
- Compare mobile and desktop page engagement before changing layout or card density.
