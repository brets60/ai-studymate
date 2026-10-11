import test from "node:test";
import assert from "node:assert/strict";

function calculateAnalytics({ sessions, tasks, attempts }) {
  const totalStudyMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalStudyHours = Number((totalStudyMinutes / 60).toFixed(1));

  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const pendingTasksCount = tasks.filter((t) => t.status !== "completed").length;

  const now = new Date();
  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  });

  const totalQuestions = attempts.reduce((acc, a) => acc + a.totalQuestions, 0);
  const totalScore = attempts.reduce((acc, a) => acc + a.score, 0);
  const quizAverage =
    totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return {
    totalStudyMinutes,
    totalStudyHours,
    completedTasksCount,
    pendingTasksCount,
    overdueTasksCount: overdueTasks.length,
    quizAverage,
  };
}

test("Analytics - Metrics calculation for study time, tasks, and quizzes", () => {
  const mockSessions = [
    { durationMinutes: 45 },
    { durationMinutes: 75 },
  ];

  const pastDate = new Date(Date.now() - 86400000).toISOString();
  const futureDate = new Date(Date.now() + 86400000).toISOString();

  const mockTasks = [
    { id: "1", status: "completed", dueDate: pastDate },
    { id: "2", status: "pending", dueDate: pastDate }, // Overdue!
    { id: "3", status: "pending", dueDate: futureDate }, // Upcoming
    { id: "4", status: "pending", dueDate: null },
  ];

  const mockAttempts = [
    { score: 8, totalQuestions: 10 },
    { score: 9, totalQuestions: 10 },
  ];

  const result = calculateAnalytics({
    sessions: mockSessions,
    tasks: mockTasks,
    attempts: mockAttempts,
  });

  assert.equal(result.totalStudyMinutes, 120);
  assert.equal(result.totalStudyHours, 2.0);
  assert.equal(result.completedTasksCount, 1);
  assert.equal(result.pendingTasksCount, 3);
  assert.equal(result.overdueTasksCount, 1);
  assert.equal(result.quizAverage, 85);
});

test("Analytics - Empty state handling with zero divisions", () => {
  const result = calculateAnalytics({
    sessions: [],
    tasks: [],
    attempts: [],
  });

  assert.equal(result.totalStudyMinutes, 0);
  assert.equal(result.totalStudyHours, 0);
  assert.equal(result.completedTasksCount, 0);
  assert.equal(result.pendingTasksCount, 0);
  assert.equal(result.overdueTasksCount, 0);
  assert.equal(result.quizAverage, 0);
});
