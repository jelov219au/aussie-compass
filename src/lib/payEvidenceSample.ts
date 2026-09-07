import type { PayEvidenceDraft } from "./payEvidenceCaseArchive";
import { createPayEvidenceRequest } from "./payEvidenceOutput";

const example: PayEvidenceDraft = {
  employerLabel: "Fictional cafe A — demonstration only",
  employmentType: "Unsure",
  rateBasisType: "unsure",
  rateBasisCheckedOn: "",
  sourceNote: "Fictional amounts for arithmetic only. Applicable Award, classification and rate have not been verified.",
  periods: [{
    id: "fictional-period", label: "1–7 September — fictional", hours: "", expectedGross: "",
    payslipGross: "210.00", payslipNet: "180.00", bankNet: "170.00",
    note: "All dates, amounts and evidence states are fictional. These differences are questions to check, not a finding of underpayment.",
    shifts: [{ id: "fictional-shift", date: "2026-09-01", start: "09:00", end: "17:00", breakMinutes: "30", rateLabel: "Fictional arithmetic rate", hourlyRate: "30.00", allowance: "0", note: "Illustrative rate only; not a minimum wage or applicable rate recommendation." }],
  }],
  evidence: { hours: "ready", roster: "review", payslip: "review", bank: "ready", basis: "review", messages: "missing" },
  requestType: "first", requestDraft: "",
};
export const payEvidenceSample: PayEvidenceDraft = { ...example, requestDraft: createPayEvidenceRequest(example) };

export const payEvidenceBlankSample: PayEvidenceDraft = {
  ...example,
  employerLabel: "Fictional blank example",
  periods: [{ id: "fictional-blank", label: "1–7 September", hours: "", expectedGross: "", payslipGross: "", payslipNet: "", bankNet: "", note: "", shifts: [] }],
  evidence: {}, requestDraft: "",
};
