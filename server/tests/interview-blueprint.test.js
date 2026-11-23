import test from "node:test";
import assert from "node:assert/strict";
import { extractJobRequirements, generateInterviewSyllabus } from "../services/interview-syllabus.service.js";
import { estimateQuestionCount, getAnswerTimeLimitSec } from "../services/interview-difficulty.service.js";
import { canFollowUp, getFollowUpBudget, planNextTurn } from "../services/interview-conversation.service.js";
import { getFallbackQuestion, getQuestionPlan } from "../services/interview-progression.service.js";

const JD = `We are hiring a Backend Developer.
- 2+ years of experience with Node.js and Express
- Strong knowledge of MongoDB and schema design
- Experience building REST APIs and integrating payment gateways
- Familiarity with Docker and CI/CD
- Excellent communication and collaboration skills
Salary: 8-12 LPA. Location: Pune`;
const RESUME = "Built a food delivery app with React, Node.js and MongoDB. Intern at Acme: reduced API latency by 40%.";
const PEOPLE = new Set(["behavioral", "situational"]);
const LEVELS = ["fresher", "junior", "mid", "senior", "lead"];
const COUNTS = [5, 10, 15, 20, 30].map((minutes) => estimateQuestionCount(minutes, "live"));

const plan = (interviewType, totalQuestions, experienceLevel = "mid") => generateInterviewSyllabus({
  role: "Backend Developer", experienceLevel, interviewType, totalQuestions, jobDescription: JD, resumeText: RESUME,
});

test("every format plans exactly as many questions as the selected time allows", () => {
  for (const interviewType of ["technical", "behavioral", "resume-based", "job-description", "mixed"]) {
    for (const count of COUNTS) {
      for (const level of LEVELS) {
        const syllabus = plan(interviewType, count, level);
        assert.equal(syllabus.length, count, `${interviewType}/${level} at ${count} questions`);
        assert.deepEqual(syllabus.map((item) => item.targetQuestionNumber), syllabus.map((_, index) => index + 1));
      }
    }
  }
});

test("behavioral interviews contain no technical questions at any length or level", () => {
  for (const count of COUNTS) {
    for (const level of LEVELS) {
      const syllabus = plan("behavioral", count, level);
      assert.ok(syllabus.every((item) => PEOPLE.has(item.questionType)), `${level} at ${count}`);
      assert.equal(new Set(syllabus.map((item) => item.category)).size, Math.min(count, 8), "no repeated competency");
    }
  }
  assert.ok(plan("behavioral", 5, "fresher").some((item) => item.questionType === "situational"), "freshers get scenarios");
  assert.equal(plan("behavioral", 3, "senior")[0].category, "Leadership & Influence");
  assert.equal(plan("behavioral", 3, "fresher")[0].category, "Teamwork & Collaboration");
});

test("technical interviews contain no behavioral questions and ramp in depth", () => {
  for (const level of LEVELS) {
    const syllabus = plan("technical", 7, level);
    assert.ok(syllabus.every((item) => item.questionType === "technical"));
    const levels = syllabus.map((item) => item.cognitiveLevel);
    assert.deepEqual(levels, [...levels].sort((a, b) => a - b), `${level} ramps upward`);
  }
  assert.equal(plan("technical", 5, "senior").at(-1).cognitiveLevel, 5);
  assert.equal(plan("technical", 5, "fresher")[0].cognitiveLevel, 1);
});

test("resume-based interviews anchor every question to the resume", () => {
  const syllabus = plan("resume-based", 11);
  assert.ok(syllabus.every((item) => item.category.startsWith("Resume:")));
  assert.equal(syllabus[0].category, "Resume: Flagship Project");
});

test("job-description interviews are built from the JD's requirements", () => {
  const { technical, soft } = extractJobRequirements(JD);
  assert.deepEqual(technical, [
    "Node.js and Express",
    "Strong knowledge of MongoDB and schema design",
    "Experience building REST APIs and integrating payment gateways",
    "Familiarity with Docker and CI/CD",
  ]);
  assert.deepEqual(soft, ["Excellent communication and collaboration skills"]);

  const three = plan("job-description", 3);
  assert.ok(three.every((item) => item.category.startsWith("JD:")));
  assert.ok(three.every((item) => !PEOPLE.has(item.questionType) || item.questionType === "situational"));
  const five = plan("job-description", 5);
  assert.equal(five.filter((item) => item.questionType === "behavioral").length, 1, "one culture-fit question");
  assert.match(five.find((item) => item.questionType === "behavioral").category, /communication/);
});

test("mixed interviews interleave technical and behavioral, behavioral by question 3", () => {
  for (const count of COUNTS) {
    const syllabus = generateInterviewSyllabus({ role: "Backend Developer", interviewType: "mixed", totalQuestions: count });
    const people = syllabus.filter((item) => PEOPLE.has(item.questionType)).length;
    assert.ok(people >= 1 && people <= Math.ceil(count * 0.5), `${count}: ${people} behavioral`);
    assert.ok(syllabus.slice(0, 3).some((item) => PEOPLE.has(item.questionType)));
    assert.ok(syllabus.some((item) => item.questionType === "technical"));
  }
});

test("answer time follows question type", () => {
  assert.equal(getAnswerTimeLimitSec({ questionType: "behavioral", cognitiveLevel: 2 }), 150);
  assert.equal(getAnswerTimeLimitSec({ questionType: "behavioral", cognitiveLevel: 4 }), 180);
  assert.equal(getAnswerTimeLimitSec({ questionType: "situational", cognitiveLevel: 3 }), 120);
  assert.equal(getAnswerTimeLimitSec({ questionType: "resume-based", cognitiveLevel: 2 }), 150);
  assert.equal(getAnswerTimeLimitSec({ questionType: "technical", cognitiveLevel: 2 }), 120);
  assert.equal(getAnswerTimeLimitSec({ questionType: "technical", cognitiveLevel: 5 }), 180);
  assert.equal(getAnswerTimeLimitSec({ questionType: "behavioral", isFollowUp: true, cognitiveLevel: 2 }), 120);
});

test("follow-up budget shrinks for short interviews", () => {
  assert.deepEqual(getFollowUpBudget(3), { maxConsecutive: 1, maxTotal: 1 });
  assert.deepEqual(getFollowUpBudget(11), { maxConsecutive: 2, maxTotal: 4 });
  const answer = "I led the migration and personally wrote the rollback plan for the team.";
  const base = { interviewType: "behavioral", totalQuestions: 3 };
  assert.equal(canFollowUp({ ...base, questions: [{ questionNumber: 1 }] }, answer), true);
  assert.equal(canFollowUp({ ...base, questions: [{ questionNumber: 1 }, { questionNumber: 2, isFollowUp: true }] }, answer), false);
  // Mixed: the last slot is reserved for the still-missing behavioral question.
  const mixed = { interviewType: "mixed", totalQuestions: 3, questions: [
    { questionNumber: 1, questionType: "technical" }, { questionNumber: 2, questionType: "technical" },
  ] };
  assert.equal(canFollowUp(mixed, answer), false);
});

test("behavioral planner prompt forbids technical questions and probes STAR", async () => {
  const question = { questionNumber: 1, questionText: "Tell me about a time you resolved a conflict.", questionType: "behavioral", category: "Conflict Resolution", cognitiveLevel: 3 };
  let systemPrompt = "";
  const turn = await planNextTurn({
    session: { ...plan, interviewType: "behavioral", role: "Backend Developer", totalQuestions: 5, syllabus: plan("behavioral", 5), questions: [question] },
    question,
    answer: "We had a disagreement about the release date and we talked about it as a team and it worked out.",
    request: async (system) => {
      systemPrompt = system;
      return { decision: "FOLLOW_UP", kind: "PROBE_DEEP", reaction: "You said the team talked it through.", question: "What did you personally say or do to move that conversation forward?" };
    },
  });
  assert.match(systemPrompt, /NEVER ask technical, coding/);
  assert.match(systemPrompt, /what THEY personally did/);
  assert.equal(turn.nextQuestion.questionType, "behavioral");
  assert.equal(turn.nextQuestion.answerTimeLimitSec, undefined);
});

test("fallback questions match the planned type", () => {
  const session = { role: "Backend Developer", interviewType: "behavioral", syllabus: plan("behavioral", 3), questions: [] };
  const next = getQuestionPlan(session);
  assert.equal(next.questionType, "behavioral");
  assert.match(getFallbackQuestion(session, next).questionText, /^Tell me about a time/);
  const situational = getFallbackQuestion(session, { ...next, questionType: "situational", category: "Conflict Resolution" });
  assert.match(situational.questionText, /^(Imagine|Suppose)/);
});

test("planned topics are not skipped when follow-ups use question numbers", () => {
  const syllabus = plan("technical", 5);
  const session = { syllabus, questions: [
    { questionNumber: 1, category: syllabus[0].category, questionType: "technical" },
    { questionNumber: 2, category: syllabus[0].category, questionType: "technical", isFollowUp: true },
  ] };
  assert.equal(getQuestionPlan(session).category, syllabus[1].category);
});
