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
- Savings goal calculator for target timelines, required regular deposits, and emergency fund planning

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
