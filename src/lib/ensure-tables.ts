import { prisma } from "./prisma";

export const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "fullName" TEXT NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "educationLevel" TEXT DEFAULT 'High School' NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email")`,
  `CREATE TABLE IF NOT EXISTS "UserSettings" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "theme" TEXT DEFAULT 'light' NOT NULL,
      "dailyStudyGoal" INTEGER DEFAULT 60 NOT NULL,
      "notificationPreferences" TEXT DEFAULT '{"email":true,"deadlines":true,"reminders":true}' NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Subject" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "color" TEXT DEFAULT '#2563eb' NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Subject_userId_idx" ON "Subject"("userId")`,
  `CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "title" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "Conversation"("userId")`,
  `CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT PRIMARY KEY,
      "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId")`,
  `CREATE TABLE IF NOT EXISTS "StudyNote" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "title" TEXT NOT NULL,
      "originalContent" TEXT NOT NULL,
      "summary" TEXT NOT NULL,
      "keyConcepts" TEXT,
      "keyTerms" TEXT,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "StudyNote_userId_idx" ON "StudyNote"("userId")`,
  `CREATE TABLE IF NOT EXISTS "FlashcardSet" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "title" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "FlashcardSet_userId_idx" ON "FlashcardSet"("userId")`,
  `CREATE TABLE IF NOT EXISTS "Flashcard" (
      "id" TEXT PRIMARY KEY,
      "flashcardSetId" TEXT NOT NULL REFERENCES "FlashcardSet"("id") ON DELETE CASCADE,
      "question" TEXT NOT NULL,
      "answer" TEXT NOT NULL,
      "difficulty" TEXT DEFAULT 'medium' NOT NULL,
      "nextReviewAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Flashcard_flashcardSetId_idx" ON "Flashcard"("flashcardSetId")`,
  `CREATE TABLE IF NOT EXISTS "Quiz" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "title" TEXT NOT NULL,
      "difficulty" TEXT DEFAULT 'medium' NOT NULL,
      "questionCount" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Quiz_userId_idx" ON "Quiz"("userId")`,
  `CREATE TABLE IF NOT EXISTS "QuizQuestion" (
      "id" TEXT PRIMARY KEY,
      "quizId" TEXT NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
      "question" TEXT NOT NULL,
      "questionType" TEXT NOT NULL,
      "options" TEXT,
      "correctAnswer" TEXT NOT NULL,
      "explanation" TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId")`,
  `CREATE TABLE IF NOT EXISTS "QuizAttempt" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "quizId" TEXT NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
      "score" INTEGER NOT NULL,
      "totalQuestions" INTEGER NOT NULL,
      "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_idx" ON "QuizAttempt"("userId")`,
  `CREATE TABLE IF NOT EXISTS "QuizResponse" (
      "id" TEXT PRIMARY KEY,
      "attemptId" TEXT NOT NULL REFERENCES "QuizAttempt"("id") ON DELETE CASCADE,
      "questionId" TEXT NOT NULL REFERENCES "QuizQuestion"("id") ON DELETE CASCADE,
      "selectedAnswer" TEXT NOT NULL,
      "isCorrect" BOOLEAN NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "QuizResponse_attemptId_idx" ON "QuizResponse"("attemptId")`,
  `CREATE TABLE IF NOT EXISTS "StudyTask" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "dueDate" TIMESTAMP(3),
      "priority" TEXT DEFAULT 'medium' NOT NULL,
      "status" TEXT DEFAULT 'pending' NOT NULL,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "StudyTask_userId_idx" ON "StudyTask"("userId")`,
  `CREATE TABLE IF NOT EXISTS "StudySession" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "durationMinutes" INTEGER NOT NULL,
      "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "endedAt" TIMESTAMP(3)
  )`,
  `CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId")`,
  `CREATE TABLE IF NOT EXISTS "UploadedDocument" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
      "filename" TEXT NOT NULL,
      "storagePath" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "fileSize" INTEGER DEFAULT 0 NOT NULL,
      "textContent" TEXT,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "UploadedDocument_userId_idx" ON "UploadedDocument"("userId")`
];

let tablesInitialized = false;

export async function ensureDatabaseTables() {
  if (tablesInitialized) return;
  for (const statement of DDL_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (e: any) {
      console.warn("Table init notice:", e.message);
    }
  }
  tablesInitialized = true;
}
