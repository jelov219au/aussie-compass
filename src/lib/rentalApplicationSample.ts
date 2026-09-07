import { createApplication, createEvidenceLibrary, createRentalMessages, type WorkspaceState } from "@/lib/rentalApplicationOutput";

// Entirely fictional, fixed inputs; use the same message generator as the paid workspace.
export const rentalApplicationSample: WorkspaceState = {
  version: 3,
  profile: { householdSize: "1", employmentSummary: "Part-time cafe work (fictional)", rentalSummary: "References available with prior consent (fictional)", petSummary: "No pets", strengths: "I keep records and respond promptly" },
  evidenceLibrary: {
    ...createEvidenceLibrary(),
    identity: { status: "ready", checkedOn: "2026-09-01" },
    income: { status: "review", checkedOn: "" },
  },
  activeId: "home-a",
  applications: [
    {
      ...createApplication("home-a", "Example home A (fictional)"),
      suburb: "Example suburb A", jurisdiction: "NSW", weeklyRent: "620", moveDate: "2026-09-20",
      stage: "follow_up", applicationDate: "2026-09-01", nextActionDate: "2026-09-08",
      statuses: { identity: "ready", income: "review", terms: "ready", agent: "ready" },
      privacyChecks: { "no-tfn": true, "verified-channel": true },
      notes: "Confirm which income evidence is needed.\nDates are personal reminders in this fictional example.",
      followUps: [{ id: "contact-a", date: "2026-09-02", channel: "portal", direction: "sent", summary: "Asked whether the application was received." }],
    },
    {
      ...createApplication("home-b", "Example home B (fictional)"),
      suburb: "Example suburb B", jurisdiction: "VIC", stage: "preparing", leaseTerm: "6 months",
      nextActionDate: "2026-09-09", statuses: { identity: "ready", income: "review" },
      notes: "Weekly rent and move-in date are not recorded.\nAsk about the application channel before submitting.",
    },
  ],
};

for (const application of rentalApplicationSample.applications) {
  application.messages = createRentalMessages(rentalApplicationSample, application);
}
