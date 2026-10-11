import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("Database CRUD - User creation, cascade deletion, and relations", async () => {
  const testEmail = `test_scholar_${Date.now()}@school.edu`;

  // 1. Create User
  const user = await prisma.user.create({
    data: {
      fullName: "Test Scholar",
      email: testEmail,
      password: "hashedpassword123",
      educationLevel: "College / University",
      subjects: {
        create: [
          { name: "Computer Science", color: "#2563eb" },
        ],
      },
    },
    include: {
      subjects: true,
    },
  });

  assert.ok(user.id);
  assert.equal(user.email, testEmail);
  assert.equal(user.subjects.length, 1);

  const subjectId = user.subjects[0].id;

  // 2. Create Study Task
  const task = await prisma.studyTask.create({
    data: {
      userId: user.id,
      subjectId: subjectId,
      title: "Data Structures Problem Set 1",
      priority: "high",
      status: "pending",
    },
  });

  assert.ok(task.id);
  assert.equal(task.status, "pending");

  // 3. Update Task Status
  const updatedTask = await prisma.studyTask.update({
    where: { id: task.id },
    data: { status: "completed" },
  });
  assert.equal(updatedTask.status, "completed");

  // 4. Create FlashcardSet and Flashcard
  const deck = await prisma.flashcardSet.create({
    data: {
      userId: user.id,
      subjectId: subjectId,
      title: "Algorithms Terms",
      flashcards: {
        create: [
          {
            question: "What is the time complexity of QuickSort average case?",
            answer: "O(n log n)",
            difficulty: "medium",
          },
        ],
      },
    },
    include: {
      flashcards: true,
    },
  });

  assert.ok(deck.id);
  assert.equal(deck.flashcards.length, 1);
  assert.equal(deck.flashcards[0].answer, "O(n log n)");

  // 5. Test Cascade Deletion: Deleting user deletes tasks, subjects, and decks
  await prisma.user.delete({
    where: { id: user.id },
  });

  const remainingDeck = await prisma.flashcardSet.findUnique({
    where: { id: deck.id },
  });
  assert.equal(remainingDeck, null, "Deck should be cascade deleted");

  const remainingTask = await prisma.studyTask.findUnique({
    where: { id: task.id },
  });
  assert.equal(remainingTask, null, "Task should be cascade deleted");
});
