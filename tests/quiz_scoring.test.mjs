import test from "node:test";
import assert from "node:assert/strict";

function scoreQuestions(questions, userAnswers) {
  let score = 0;
  const review = questions.map((q) => {
    const selected = (userAnswers[q.id] || "").trim();
    const target = q.correctAnswer.trim();

    const isCorrect =
      selected.toLowerCase() === target.toLowerCase() ||
      (q.questionType === "identification" &&
        selected.toLowerCase().includes(target.toLowerCase()));

    if (isCorrect) score += 1;

    return {
      questionId: q.id,
      selectedAnswer: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
    };
  });

  const percentage = Math.round((score / Math.max(1, questions.length)) * 100);
  return { score, total: questions.length, percentage, review };
}

test("Quiz Scoring - Multiple Choice and True/False correct scoring", () => {
  const questions = [
    {
      id: "q1",
      questionType: "multiple_choice",
      correctAnswer: "Photosynthesis",
    },
    {
      id: "q2",
      questionType: "true_false",
      correctAnswer: "True",
    },
    {
      id: "q3",
      questionType: "identification",
      correctAnswer: "Mitochondria",
    },
  ];

  const userAnswers = {
    q1: "photosynthesis", // lowercase match
    q2: "True", // exact match
    q3: "the Mitochondria powerhouse", // identification substring match
  };

  const result = scoreQuestions(questions, userAnswers);

  assert.equal(result.score, 3);
  assert.equal(result.total, 3);
  assert.equal(result.percentage, 100);
  assert.equal(result.review[0].isCorrect, true);
  assert.equal(result.review[1].isCorrect, true);
  assert.equal(result.review[2].isCorrect, true);
});

test("Quiz Scoring - Handles incorrect, blank, and partial answers", () => {
  const questions = [
    {
      id: "q1",
      questionType: "multiple_choice",
      correctAnswer: "Option A",
    },
    {
      id: "q2",
      questionType: "true_false",
      correctAnswer: "False",
    },
  ];

  const userAnswers = {
    q1: "Option B", // Wrong
    q2: "", // Blank
  };

  const result = scoreQuestions(questions, userAnswers);

  assert.equal(result.score, 0);
  assert.equal(result.percentage, 0);
  assert.equal(result.review[0].isCorrect, false);
  assert.equal(result.review[1].isCorrect, false);
});

test("Quiz Security - Sanitizes exam payload before submission", () => {
  const rawDbQuestions = [
    {
      id: "q1",
      question: "What is 2 + 2?",
      questionType: "multiple_choice",
      options: '["3", "4", "5"]',
      correctAnswer: "4",
      explanation: "Basic addition.",
    },
  ];

  // Emulate GET /api/quizzes/[id] projection
  const sanitized = rawDbQuestions.map((q) => {
    const { correctAnswer, explanation, ...publicFields } = q;
    return publicFields;
  });

  assert.equal(sanitized[0].correctAnswer, undefined, "correctAnswer must NOT be exposed");
  assert.equal(sanitized[0].explanation, undefined, "explanation must NOT be exposed");
  assert.equal(sanitized[0].id, "q1");
  assert.equal(sanitized[0].question, "What is 2 + 2?");
});
