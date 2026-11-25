// Run with node client/tests/interview-free-time-warning.mjs.
// Set INTERVIEW_TEST_BROWSER_CHANNEL to use a locally installed Chrome or Edge.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
process.env.VITE_API_URL = "/api";
const vite = await createServer({ server: { host: "127.0.0.1", port: 5213 } });

const account = (id) => ({
  _id: id, name: "Interview Test", email: `${id}@example.test`,
  subscription: { tier: "free", status: "active" },
});
const freeAccess = (remainingSeconds) => ({ tier: "free", canStart: true, remainingSeconds });
const sessionId = "practice-session";
let browser;
try {
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = await chromium.launch({
    channel: process.env.INTERVIEW_TEST_BROWSER_CHANNEL || undefined,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  const page = await browser.newPage({ permissions: ["camera", "microphone"] });
  page.setDefaultTimeout(15000);
  let user = account("candidate-one");
  let access = freeAccess(601);
  await page.addInitScript((initialUser) => {
    localStorage.setItem("token", "local-interview-test-token");
    if (!localStorage.getItem("user")) localStorage.setItem("user", JSON.stringify(initialUser));
  }, user);
  await page.route((url) => url.origin !== origin, (route) => route.abort());
  await page.route((url) => url.origin === origin && url.pathname.startsWith("/api/"), async (route) => {
    const path = new URL(route.request().url()).pathname;
    const responses = {
      "/api/auth/me": { user },
      "/api/interview/access": access,
      "/api/interview/config": {
        interviewTypes: [{ id: "technical", name: "Technical Interview" }],
        roles: [{ id: "backend", name: "Backend Engineer" }],
      },
      "/api/resume/list": { resumes: [] },
      "/api/interview/sessions": { sessionId, mode: "text", totalQuestions: 1 },
      [`/api/interview/sessions/${sessionId}/answer`]: { isComplete: true, progress: { current: 1, total: 1 } },
      [`/api/interview/sessions/${sessionId}/complete`]: { overallScore: 78, summary: "Your interview report is ready." },
    };
    let data = responses[path] || {};
    if (path === `/api/interview/sessions/${sessionId}/start`) {
      access = freeAccess(600);
      data = {
        sessionId, status: "in-progress", startedAt: new Date().toISOString(),
        currentQuestion: { number: 1, text: "How do you design a reliable API?", type: "technical", turnToken: "local-test" },
        progress: { current: 1, total: 1 },
      };
    }
    await route.fulfill({ json: { success: true, data, ...data } });
  });

  const studio = `${origin}/interview`;
  const warning = page.getByRole("alertdialog", { name: /free interview minutes? remaining/ });
  const openForAccount = async (id, quota) => {
    user = account(id);
    access = quota;
    await page.evaluate((currentUser) => localStorage.setItem("user", JSON.stringify(currentUser)), user);
    await page.goto(studio);
  };
  await page.goto(studio);
  await page.getByRole("heading", { name: "11 free interview minutes remaining" }).waitFor();
  assert.equal(await warning.count(), 0, "no warning above ten minutes");

  await page.getByText("Choose a format", { exact: true }).click();
  await page.getByText("Technical Interview", { exact: true }).click();
  const role = page.getByRole("combobox", { name: "Role" });
  await role.fill("Backend Engineer");
  await role.press("Enter");
  await page.getByText("Text", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.getByText("How do you design a reliable API?").waitFor();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  assert.equal(await warning.count(), 0, "no warning during a live interview");

  await page.getByLabel("Your answer").fill("I use idempotent requests, backoff and graceful timeouts.");
  await page.getByRole("button", { name: "Submit answer" }).click();
  await page.getByText("Interview Complete", { exact: true }).waitFor();
  await page.getByRole("alertdialog", { name: "10 free interview minutes remaining" }).waitFor();
  await warning.getByText("Pro includes 10 AI interviews per billing month.", { exact: false }).waitFor();
  await warning.getByRole("button", { name: "Keep practicing" }).click();
  await warning.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Practice Again" }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "10 free interview minutes remaining" }).waitFor();
  assert.equal(await warning.count(), 0, "dismissal persists on reload");

  await openForAccount("candidate-two", freeAccess(540));
  const secondWarning = page.getByRole("alertdialog", { name: "9 free interview minutes remaining" });
  await secondWarning.waitFor();
  await secondWarning.getByRole("button", { name: "View subscription plans" }).click();
  await page.waitForURL("**/pricing");
  await page.getByText("30-Minute AI Interview Simulation", { exact: true }).waitFor();
  await page.getByText("10 AI interviews per month", { exact: true }).waitFor();
  await page.getByText("₹199", { exact: true }).waitFor();

  await openForAccount("exhausted-candidate", {
    tier: "free", canStart: false, remainingSeconds: 0, code: "FREE_INTERVIEW_ACCESS_EXHAUSTED",
    message: "You've used your 30 free minutes of AI Interview Simulation.", upgradeUrl: "/pricing",
  });
  await page.getByRole("heading", { name: "Free interview access exhausted" }).waitFor();
  assert.equal(await warning.count(), 0, "exhausted accounts see the existing exhausted notice");

  await openForAccount("pro-candidate", { tier: "pro", canStart: true, remainingInterviews: 2, monthlyLimit: 10 });
  await page.getByRole("heading", { name: "2 of 10 AI interviews remaining this subscription month" }).waitFor();
  assert.equal(await warning.count(), 0, "paid accounts never get the free-time warning");
  console.log("PASS: free-time warning threshold, live interview, dismissal, account isolation, pricing, and exhaustion");
} finally {
  await browser?.close();
  await vite.close();
}
