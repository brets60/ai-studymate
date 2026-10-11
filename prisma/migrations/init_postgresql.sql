-- AI StudyMate PostgreSQL / Supabase Migration Schema
-- Generated for PostgreSQL with Row-Level Security, foreign keys, and indexes

-- 1. Users
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "fullName" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "educationLevel" TEXT DEFAULT 'High School' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- 2. User Settings
CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "theme" TEXT DEFAULT 'light' NOT NULL,
    "dailyStudyGoal" INTEGER DEFAULT 60 NOT NULL,
    "notificationPreferences" TEXT DEFAULT '{"email":true,"deadlines":true,"reminders":true}' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Subjects
CREATE TABLE IF NOT EXISTS "Subject" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#2563eb' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "Subject_userId_idx" ON "Subject"("userId");

-- 4. Conversations
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "Conversation_userId_idx" ON "Conversation"("userId");
CREATE INDEX IF NOT EXISTS "Conversation_subjectId_idx" ON "Conversation"("subjectId");

-- 5. Messages
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");

-- 6. Study Notes
CREATE TABLE IF NOT EXISTS "StudyNote" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "title" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyConcepts" TEXT,
    "keyTerms" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "StudyNote_userId_idx" ON "StudyNote"("userId");
CREATE INDEX IF NOT EXISTS "StudyNote_subjectId_idx" ON "StudyNote"("subjectId");

-- 7. Flashcard Sets
CREATE TABLE IF NOT EXISTS "FlashcardSet" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "FlashcardSet_userId_idx" ON "FlashcardSet"("userId");

-- 8. Flashcards
CREATE TABLE IF NOT EXISTS "Flashcard" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "flashcardSetId" TEXT NOT NULL REFERENCES "FlashcardSet"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "difficulty" TEXT DEFAULT 'medium' NOT NULL,
    "nextReviewAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "Flashcard_flashcardSetId_idx" ON "Flashcard"("flashcardSetId");
CREATE INDEX IF NOT EXISTS "Flashcard_nextReviewAt_idx" ON "Flashcard"("nextReviewAt");

-- 9. Quizzes
CREATE TABLE IF NOT EXISTS "Quiz" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT DEFAULT 'medium' NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "Quiz_userId_idx" ON "Quiz"("userId");
CREATE INDEX IF NOT EXISTS "Quiz_subjectId_idx" ON "Quiz"("subjectId");

-- 10. Quiz Questions
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "quizId" TEXT NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "options" TEXT,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT
);
CREATE INDEX IF NOT EXISTS "QuizQuestion_quizId_idx" ON "QuizQuestion"("quizId");

-- 11. Quiz Attempts
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "quizId" TEXT NOT NULL REFERENCES "Quiz"("id") ON DELETE CASCADE,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "QuizAttempt_userId_idx" ON "QuizAttempt"("userId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- 12. Quiz Responses
CREATE TABLE IF NOT EXISTS "QuizResponse" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "attemptId" TEXT NOT NULL REFERENCES "QuizAttempt"("id") ON DELETE CASCADE,
    "questionId" TEXT NOT NULL REFERENCES "QuizQuestion"("id") ON DELETE CASCADE,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL
);
CREATE INDEX IF NOT EXISTS "QuizResponse_attemptId_idx" ON "QuizResponse"("attemptId");

-- 13. Study Tasks (Planner)
CREATE TABLE IF NOT EXISTS "StudyTask" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT DEFAULT 'medium' NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "StudyTask_userId_idx" ON "StudyTask"("userId");
CREATE INDEX IF NOT EXISTS "StudyTask_dueDate_idx" ON "StudyTask"("dueDate");
CREATE INDEX IF NOT EXISTS "StudyTask_status_idx" ON "StudyTask"("status");

-- 14. Study Sessions
CREATE TABLE IF NOT EXISTS "StudySession" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "durationMinutes" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "StudySession_userId_idx" ON "StudySession"("userId");
CREATE INDEX IF NOT EXISTS "StudySession_startedAt_idx" ON "StudySession"("startedAt");

-- 15. Uploaded Documents
CREATE TABLE IF NOT EXISTS "UploadedDocument" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "subjectId" TEXT REFERENCES "Subject"("id") ON DELETE SET NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER DEFAULT 0 NOT NULL,
    "textContent" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "UploadedDocument_userId_idx" ON "UploadedDocument"("userId");
