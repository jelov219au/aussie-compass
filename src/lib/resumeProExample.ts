import { emptyResume, type ResumeData } from "@/lib/resumeBuilderData";
import { buildInterviewQuestions } from "@/lib/resumeInterviewPrep";
import { createResumeProCoverLetter, extractKeywords } from "@/lib/resumeProOutput";

// Fixed fictional inputs. No real employer, contact details, qualification or outcome.
export const resumeProExampleResume: ResumeData = {
  ...emptyResume,
  name: "Example Candidate (fictional)", title: "Barista",
  location: "Example city, Australia (fictional)",
  summary: "FICTIONAL EXAMPLE — DO NOT SUBMIT. Customer-focused hospitality worker who keeps orders accurate during busy periods and helps new team members follow the service routine.",
  skills: "Customer service, Order accuracy, Team training, Cafe workflow",
  licences: "No licences or certificates are claimed in this fictional example.",
  languages: "Korean and English (fictional example)",
  experiences: [{ id: "example-experience", role: "Barista", company: "Southern Cross Sample Cafe (fictional)", period: "Example period", details: "In this fictional scenario, handled a busy service period, checked order details and showed a new team member the agreed hand-off steps.\nExample result: the team completed the shift with fewer remakes. This is an invented example, not an applicant achievement." }],
  education: [{ id: "example-education", course: "Example hospitality course (fictional)", school: "Fictional training provider", period: "Example period" }],
};

const input = {
  company: "Southern Cross Sample Cafe (fictional)", role: "Barista (example)", hiringManager: "Hiring Manager",
  tone: "clear" as const,
  jobAd: "Customer service and order accuracy. Customer service and team training. Cafe workflow, food safety and weekend availability.",
};
const keywords = extractKeywords(input.jobAd);
const resumeText = JSON.stringify(resumeProExampleResume).toLowerCase();
export const resumeProExampleMatched = keywords.filter((word) => resumeText.includes(word));
export const resumeProExampleMissing = keywords.filter((word) => !resumeText.includes(word));
export const resumeProExampleStarStory = {
  id: "fictional-star", title: "Fictional busy-shift training example", competency: "Customer service and teamwork",
  situation: "In this fictional example, a new team member joined during a busy cafe shift.",
  task: "Keep service moving while helping the team member follow the order hand-off process.",
  action: "Demonstrated the steps, used a short verbal check before each hand-off and stayed available for questions.",
  result: "Fictional example result: the team completed the shift with fewer remakes. This is not an actual applicant achievement.",
  updatedAt: "2026-09-07T00:00:00.000Z",
};
const interviewQuestions = buildInterviewQuestions({ ...input, keywords });
const answerNotes: Record<string, string> = {
  motivation: "Fictional practice note: connect the example cafe service experience to order accuracy and customer communication. Replace it with your own experience before use.",
  "first-weeks": "Fictional practice note: learn the verified service process, ask about safety requirements and check each hand-off with the team.",
  "candidate-question": "Fictional practice questions: how is initial training organised, and what would good progress in the first month look like?",
};
export const resumeProExampleDraft = {
  ...input, applicationDeadline: "", applicationStatus: "preparing" as const,
  layout: "editorial" as const, accent: "eucalyptus" as const,
  coverLetter: createResumeProCoverLetter(resumeProExampleResume, input, resumeProExampleMissing),
  jobAdEvidence: [], resumeSnapshot: resumeProExampleResume, starStoryId: resumeProExampleStarStory.id,
  interviewQuestions,
  interviewAnswers: Object.fromEntries(interviewQuestions.map((question) => [question.id, answerNotes[question.id] ?? `Fictional practice note: ${resumeProExampleStarStory.action} ${resumeProExampleStarStory.result}`])),
};
