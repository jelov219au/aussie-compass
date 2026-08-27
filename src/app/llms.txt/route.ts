import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

function absoluteUrl(path: `/${string}`) {
  return `${siteUrl}${path}`;
}

function buildLlmsText() {
  return `# Hoju Compass

> Korean-first practical tools and official-source-linked guides for people working and living in Australia. Hoju Compass is independent and is not an Australian government service.

## Start with the free practical tools

- [Free Australian Resume Builder](${absoluteUrl("/resume-builder")}): Draft an English resume, keep the entered details in the current browser, and export a PDF or editable backup. The builder does not invent experience or qualifications.
- [Free Resume and Job Ad Checker](${absoluteUrl("/resume-job-ad-checker")}): Compare resume and job-ad text in the current browser without sending either text to the Hoju Compass server. It identifies wording to verify, not an ATS score or hiring prediction.

## Paid continuation

- [Resume Pro](${absoluteUrl("/resume-pro")}): Optional one-time paid access for preparing a job-specific resume, cover letter, STAR interview notes, and an application kit from the user's verified experience. The free builder and checker do not require Resume Pro. Check the product page for current price and availability. No tool guarantees an interview or job.
- [Purchase and seller information](${absoluteUrl("/purchase-information")}): Seller identity, delivery, payment, refund, and Australian Consumer Law information.
- [Privacy information](${absoluteUrl("/privacy")}): Data boundaries for local tools, analytics, and payments.

## Official-source-linked practical guides

- [Australian resume template and submission checklist](${absoluteUrl("/resources/australia-resume-template-submission-checklist")}): Free Word/PDF workflow and a fact, formatting, keyword, and submission checklist linked to Workforce Australia guidance.
- [Australian cover-letter and job-ad checklist](${absoluteUrl("/resources/australia-cover-letter-job-ad-checklist")}): Check whether a cover letter is requested, connect only real experience, and verify the final file against Workforce Australia guidance.
- [Resume achievement examples using STAR](${absoluteUrl("/resources/english-resume-achievement-examples")}): Turn verifiable experience into resume evidence without fabricating metrics, using Workforce Australia and Australian Public Service Commission references.
- [Practical Australian job-search plan](${absoluteUrl("/resources/australia-job-search-plan")}): Track applications and next actions with Workforce Australia and Fair Work privacy references.

## Primary official references

- [Workforce Australia: Write a resume](https://www.workforceaustralia.gov.au/individuals/coaching/job-applications/resumes)
- [Workforce Australia: Write a cover letter](https://www.workforceaustralia.gov.au/individuals/coaching/job-applications/cover-letters)
- [Workforce Australia: Job application tips](https://www.workforceaustralia.gov.au/individuals/coaching/job-applications/job-application-tips)

## Discovery and use boundaries

- [All practical tools](${absoluteUrl("/tools")})
- [All source-linked resources](${absoluteUrl("/resources")})
- [Editorial policy](${absoluteUrl("/editorial-policy")})
- [XML sitemap](${absoluteUrl("/sitemap.xml")})

Use Hoju Compass pages for general practical preparation. Follow the linked government source for current legal, employment, tax, visa, or eligibility decisions. Do not submit private resume text, job-ad text, identity documents, payment details, or access codes to indexing systems.
`;
}

export function GET() {
  return new Response(buildLlmsText(), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
