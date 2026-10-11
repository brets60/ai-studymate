import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3000";

test("E2E Workflow - Register, Tutor Chat, Quiz Generation, Scoring, and Analytics", async () => {
  const timestamp = Date.now();
  const testEmail = `e2e_student_${timestamp}@example.com`;
  const password = "ValidPassword123!";

  // 1. Register a new user
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "E2E Test Student",
      email: testEmail,
      password: password,
      educationLevel: "College / University",
    }),
  });

  assert.equal(regRes.status, 200, "Registration should succeed");
  const regData = await regRes.json();
  assert.equal(regData.success, true);
  assert.ok(regData.user.id);

  // Extract set-cookie header
  const cookieHeader = regRes.headers.get("set-cookie");
  assert.ok(cookieHeader, "Session cookie must be returned");
  const sessionCookie = cookieHeader.split(";")[0];

  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: sessionCookie,
  };

  // 2. Verify Session via /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: authHeaders,
  });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.email, testEmail);

  // 3. Ask AI Tutor via /api/tutor/chat
  const chatRes = await fetch(`${BASE_URL}/api/tutor/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      message: "Explain the Pythagorean theorem step-by-step",
      responseMode: "step_by_step",
    }),
  });
  assert.equal(chatRes.status, 200);
  const chatData = await chatRes.json();
  assert.ok(chatData.conversationId);
  assert.ok(chatData.message.content.length > 50);

  // 4. Generate Practice Quiz via /api/quizzes/generate
  const quizRes = await fetch(`${BASE_URL}/api/quizzes/generate`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      subjectName: "Mathematics",
      topic: "Pythagorean Theorem",
      questionCount: 3,
      difficulty: "medium",
      questionTypes: ["multiple_choice", "true_false"],
    }),
  });
  assert.equal(quizRes.status, 201);
  const quizData = await quizRes.json();
  assert.ok(quizData.quiz.id);

  // 5. Fetch Quiz to take it (verify hidden answer key)
  const takeRes = await fetch(`${BASE_URL}/api/quizzes/${quizData.quiz.id}`, {
    headers: authHeaders,
  });
  assert.equal(takeRes.status, 200);
  const takeData = await takeRes.json();
  const firstQ = takeData.quiz.questions[0];
  assert.equal(firstQ.correctAnswer, undefined, "Active taking session must NOT leak answer key");

  // 6. Submit Quiz Answers via /api/quizzes/[id]/submit
  const submitRes = await fetch(`${BASE_URL}/api/quizzes/${quizData.quiz.id}/submit`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      answers: {
        [firstQ.id]: "True",
      },
    }),
  });
  assert.equal(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.ok(typeof submitData.score === "number");
  assert.ok(submitData.review.length > 0);
  assert.ok(submitData.review[0].correctAnswer, "Review stage must include correct answer and explanation");

  // 7. Create a study task in Planner
  const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Complete Geometry Problem Set",
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: "high",
    }),
  });
  assert.equal(taskRes.status, 201);
  const taskData = await taskRes.json();
  assert.equal(taskData.task.status, "pending");

  // 8. Log a 25-minute focus session
  const sessionRes = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      durationMinutes: 25,
    }),
  });
  assert.equal(sessionRes.status, 201);

  // 9. Fetch Analytics
  const analyticsRes = await fetch(`${BASE_URL}/api/analytics`, {
    headers: authHeaders,
  });
  assert.equal(analyticsRes.status, 200);
  const analyticsData = await analyticsRes.json();
  assert.equal(analyticsData.metrics.totalStudyMinutes, 25);
  assert.equal(analyticsData.metrics.totalQuizzesAttempted, 1);
  assert.ok(analyticsData.metrics.currentStreak >= 1);
  assert.equal(analyticsData.upcomingDeadlines.length, 1);
});
