import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildInterviewQuestions,
  composeStarAnswer,
  hasStarContent,
} from "../src/lib/resumeInterviewPrep.ts";

const questions = buildInterviewQuestions({
  company: "Harbour Cafe",
  role: "Barista",
  keywords: ["customer", "quality", "teamwork"],
});

assert.equal(questions.length, 6, "three job-ad keywords should produce six interview questions");
assert.match(questions[0].question, /Barista role at Harbour Cafe/);
assert.match(questions[1].question, /customer/);
assert.deepEqual(questions.map((question) => question.id), [
  "motivation",
  "evidence-1",
  "evidence-2",
  "evidence-3",
  "first-weeks",
  "candidate-question",
]);

const emptyQuestions = buildInterviewQuestions({ company: "", role: "", keywords: [] });
assert.equal(emptyQuestions.length, 3, "the builder should still offer useful baseline questions without a job ad");
assert.equal(new Set(emptyQuestions.map((question) => question.id)).size, emptyQuestions.length);
assert.doesNotMatch(emptyQuestions[0].question, /this role role/);

const star = {
  competency: "customer service",
  situation: "A customer received the wrong order",
  task: "I needed to resolve it before the lunch rush",
  action: "I apologised, remade the order and checked the docket process",
  result: "The customer stayed and the same error did not recur that shift",
};
assert.equal(hasStarContent(star), true);
assert.match(composeStarAnswer(star), /^Situation:/);
assert.match(composeStarAnswer(star), /\nResult:/);
assert.equal(hasStarContent({ ...star, situation: "", task: "", action: "", result: "" }), false);

const workspace = readFileSync(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8");
assert.doesNotMatch(workspace, /draft\.star(?:\.|\[)/, "the integrated workspace must not retain an embedded draft.star model");
assert.match(workspace, /composeStarAnswer\(starStoryDraft\)/, "the interview answer builder must use the shared STAR library draft");
assert.match(workspace, /toStarStoryDraft\(linkedStory\)/, "loading an application must restore its linked STAR library experience");
assert.match(workspace, /setField\("starStoryId", story\.id\)/, "selecting a STAR experience must link it to the application");
assert.match(workspace, /onClick=\{saveStarStory\}/, "the interview STAR builder must save or update the shared library");
assert.match(workspace, /stringValue = <K extends [^\n]+"starStoryId"/, "the draft normaliser must allowlist the STAR library link");
assert.match(workspace, /starStoryId: stringValue\("starStoryId"\)/, "older application drafts must retain an existing STAR library link when present");
assert.match(workspace, /const storedQuestions = Array\.isArray\(stored\.interviewQuestions\)/, "older drafts without interview fields must receive compatible defaults");
assert.match(workspace, /REUSABLE STAR EXPERIENCE/, "the TXT application kit must retain the selected reusable STAR experience");
assert.match(workspace, /INTERVIEW PREPARATION/, "the TXT application kit must include interview notes");
assert.match(workspace, /STAR_STORY_LIMIT = 20/, "the shared STAR library limit must remain enforced");
assert.match(workspace, /기존 경험을 삭제한 뒤 새 경험을 추가해 주세요/, "the limit must not silently evict saved STAR experiences");

console.log("Resume Pro interview preparation checks passed.");
