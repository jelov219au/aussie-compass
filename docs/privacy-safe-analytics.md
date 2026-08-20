# Privacy-safe website analytics

Hoju Compass uses Vercel Web Analytics for aggregate product decisions without advertising cookies.

## Data boundaries

- Every page-view URL has its query string and fragment removed before transmission.
- A homepage search sends only a predefined topic such as `tax`, `pay`, `housing`, or `other`.
- Search text, calculator inputs, resume content, email addresses, payment IDs, local storage, and checklist details are never included in custom events.
- Navigation events contain only an allowlisted internal destination and a homepage section or route category.

## Events

| Event | Properties | Decision it supports |
| --- | --- | --- |
| `Home Search` | `topic`, `entry` | Which subject areas need more prominent tools or guides |
| `Home Navigation` | `section`, `destination` | Which essential homepage cards people use |
| `Route Plan Saved` | `stage`, `concern` | Which situations most often become a saved plan |
| `Route Recommendation Opened` | `destination`, `route` | Which recommendations work for each broad situation |

The properties are deliberately limited to two per event so their meaning stays stable and compatible with the standard Vercel custom-event limits.

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
