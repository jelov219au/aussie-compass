# Aussie Compass

Practical tools and trusted guides for Koreans living in Australia.

## Current Features

- Landing Page
- Integrated Salary Calculator with 2025–26 and 2026–27 tax years, resident and Working Holiday Maker tax profiles, hourly, annual salary and super-inclusive package inputs, adjustable working weeks, salary comparison, locally saved calculation settings, shareable calculation links, and copyable or printable pay results (12% Super)
- Korean-first landing page
- Minimum Wage and Casual Loading Guide (2026 rates)
- Korean Payslip Guide covering Gross Pay, Net Pay, PAYG, Super and YTD
- Korean Award and Classification Guide for checking minimum pay rates
- Korean Underpayment Guide for checking records, pay rates and next steps
- Korean Leave Guide covering annual leave, sick and carer's leave, and public holidays
- Dedicated Pay Guides hub
- Branded browser icons and web app manifest
- Mobile-friendly touch targets for calculator actions and navigation
- Keyboard-friendly skip navigation for faster access to page content
- Reduced-motion support that follows the visitor's device accessibility setting
- English resume builder with Korean-to-English resume suggestions, example sentences, colour and density themes, live preview, local autosave, draft backup, ATS-friendly text copy, and print/PDF output
- Cost of living calculator with mixed payment frequencies, income comparison, local autosave, custom expenses, and printable results
- Dedicated tools hub linking all available calculators and builders
- Savings goal project with target timelines, contribution check-ins, progress milestones, recurring calendar reminders, and emergency fund planning
- Local-first job application tracker for vacancies, interviews, offers, next actions, filtering, and JSON backups
- SEO-focused Korean resources hub with actionable job search, resume, savings guides, and contextual tool links
- Career pathway explorer that clearly separates labour shortages from skilled migration eligibility and links to official sources
- Tax return preparation hub with an annual local checklist and official ATO links
- Downloadable EOFY calendar reminders for pre-fill review and the self-lodgment deadline check
- Local-first service quote comparator for itemised costs, business checks, licensing prompts, timelines, and warranties
- Property inspection checklist with tailored share-house, rental, and purchase modes, concern tracking, and state-specific official links
- Used-car comparison with first-year ownership costs and PPSR, VIN, registration, history, inspection, and test-drive checks
- Moving project with staged preparation, address-change tasks, local progress, and downloadable calendar reminders
- Private service-price log with itemised costs and personal median/range summaries, designed as a safe precursor to verified public data

## Coming Soon

- Community

## Getting started

Install [Node.js LTS](https://nodejs.org/) (includes npm), then run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For production SEO URLs, set `NEXT_PUBLIC_SITE_URL` to the deployed site origin. It defaults to `https://aussie-compass.vercel.app`.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## Project structure

- `src/app/` — Next.js App Router pages and layout
- `src/components/` — reusable UI and section components
- `src/content/` — site copy (structured for future Korean localization)
- `src/data/` — tool and article card data
