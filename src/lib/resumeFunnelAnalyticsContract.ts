export const resumeFunnelEvents = {
  builderStarted: "Resume Builder Started",
  jobAdViewed: "Resume Job Ad Viewed",
  jobAdSampleViewed: "Resume Job Ad Sample Viewed",
  jobAdChecked: "Resume Job Ad Checked",
  proCtaClicked: "Resume Pro CTA Clicked",
} as const;

export const resumeFunnelSurfaces = {
  builderForm: "resume_builder_form",
  builderCompletion: "resume_builder_completion",
  jobAdCheckerForm: "resume_job_ad_checker_form",
  jobAdCheckerResult: "resume_job_ad_checker_result",
  articleNextStep: "article_next_step",
  homePremium: "home_resume_pro",
  proFinder: "pro_finder",
  proCatalogCard: "pro_catalog_card",
} as const;

export const resumeFunnelContexts = {
  resumeBuilder: "resume_builder",
  jobAdChecker: "resume_job_ad_checker",
  resumeTemplateGuide: "resume_template_guide",
  achievementGuide: "resume_achievement_guide",
  jobSearchGuide: "job_search_guide",
  coverLetterGuide: "cover_letter_guide",
  home: "home",
  proCatalog: "pro_catalog",
} as const;

export type ResumeFunnelEventName = (typeof resumeFunnelEvents)[keyof typeof resumeFunnelEvents];
export type ResumeFunnelSurface = (typeof resumeFunnelSurfaces)[keyof typeof resumeFunnelSurfaces];
export type ResumeFunnelContext = (typeof resumeFunnelContexts)[keyof typeof resumeFunnelContexts];
export type ResumeProCtaSurface = Exclude<ResumeFunnelSurface, typeof resumeFunnelSurfaces.builderForm>;
export type ResumeProCtaHref =
  | "/resume-pro"
  | "/resume-pro?from=job-ad-checker"
  | "/resume-pro?from=article-resume-template"
  | "/resume-pro?from=article-job-search-plan"
  | "/resume-pro?from=article-achievement-examples"
  | "/resume-pro?from=article-cover-letter-checklist"
  | "/resume-pro?from=resume-builder-complete"
  | "/resume-pro?from=home-premium"
  | "/resume-pro?from=pro-finder"
  | "/resume-pro?from=pro-catalog-card";
