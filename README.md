# AI StudyMate 🎓

**AI StudyMate** is a full-stack, production-minded academic assistance platform built with Next.js 15, TypeScript, Tailwind CSS, Prisma ORM, and Google Gemini AI. It empowers high school, senior high, and college students to master complex coursework through pedagogical AI tutoring, lecture note synthesis, exam practice with instant grading, active recall flashcards, and structured academic planning.

---

## 🌟 Key Features

1. **AI Academic Tutor (`/tutor`)**
   - 6 Pedagogical Response Modes:
     - *Simple Explanation* (intuitive analogies for beginners)
     - *Detailed Academic* (theoretical foundations & rigor)
     - *Step-by-Step Solution* (clear sequential reasoning for math & algorithms)
     - *Give Me an Example* (concrete real-world applications)
     - *Quiz Me* (mini test questions with guided hints)
     - *Socratic Guided Discovery* (guides understanding without giving answers to copy)
   - LaTeX math equations rendered via KaTeX ($E=mc^2$).
   - Persistent chat histories, follow-up suggestion pills, copy & regenerate buttons.

2. **AI Notes Summarizer & Document Assistant (`/summarizer`)**
   - Paste notes or upload files (PDF, TXT, MD, CSV, images up to 10MB).
   - Automatically extracts concise summaries, key concepts & definitions, and high-yield reviewer bullet points.
   - 1-click option to auto-generate an active recall flashcard deck alongside the note.
   - Export notes as formatted Markdown or copy with one click.

3. **AI Quiz & Examination Generator (`/quizzes`)**
   - Configurable by subject, topic, question count, difficulty (Easy, Medium, Hard), and question types (Multiple Choice, True/False, Identification).
   - **Academic Integrity Guard:** Correct answer keys and explanations are strictly withheld on the server until the exam is submitted.
   - Interactive exam navigator with instant automatic grading, detailed explanations, and retry options.

4. **Flashcards & Active Recall (`/flashcards`)**
   - AI-generated or manually authored study decks.
   - Front-to-back interactive flip cards with shuffle mode.
   - Spaced-repetition scheduling: rate cards as *Hard* (1d), *Medium* (3d), *Easy* (7d), or *Mastered* (14d).

5. **Academic Planner (`/planner`)**
   - Assignment tracking, due dates, and priority tags (*Low*, *Medium*, *High*, *Urgent*).
   - Toggleable List and Calendar schedule views.
   - Overdue assignment alerts and completion checkoffs.

6. **Focus Study Timer (Pomodoro)**
   - Built into the application sidebar.
   - Start 25-minute study intervals or custom deep work blocks; automatically logs study minutes to database metrics upon completion.

7. **Academic Progress Analytics (`/progress`)**
   - Empirical statistics backed by real database records: total study hours, assignments completed, quiz average accuracy, and study streaks.
   - Weekly study minutes graph and subject accuracy breakdown.
   - Automatic detection of strong subject areas vs. topics needing review.

8. **Personal Study Library (`/library`)**
   - Centralized repository of all saved AI conversations, reviewer notes, flashcard decks, generated quizzes, and uploaded documents.
   - Fast keyword search, subject filtering, category tabs, and deletion.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, KaTeX (LaTeX math).
- **Backend:** Next.js Route Handlers, Zod schema validation, Jose (JWT sessions), bcryptjs (password hashing).
- **Database:** Prisma ORM with SQLite (zero-config local dev) and complete PostgreSQL / Supabase migration schema.
- **AI Integrations:** Google Gemini API (`@google/generative-ai`) with structured JSON schema outputs and pedagogical fallbacks.
- **Testing:** Node.js native test runner (`node --test`) covering auth, database CRUD, file validation, quiz grading, analytics, and live E2E workflows.

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Node.js** v18.17+ or v20+ / v22+ / v24+
- **npm** v9+

### 2. Installation
```bash
# Clone the repository and navigate into the project directory
cd "bagaporo AI"

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secure-jwt-secret-key-at-least-32-chars-long"
GEMINI_API_KEY="" # Optional: Get free key from https://aistudio.google.com/app/apikey
UPLOAD_DIR="./uploads"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup
Initialize the database schema and generate the Prisma Client:
```bash
# Push schema to local SQLite database
npx prisma db push
```

### 5. Running the Application
```bash
# Start Next.js development server
npm run dev

# Or run the production build
npm run build
npm run start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Testing

AI StudyMate includes 14 automated tests verifying core business logic, security, and user workflows:

```bash
npm test
```

### Test Coverage:
- `tests/auth.test.mjs`: Password hashing with bcrypt, JWT token signing, verification, and expiry rejection.
- `tests/database_crud.test.mjs`: Prisma model relations, task creation, deck creation, and cascade deletes.
- `tests/quiz_scoring.test.mjs`: Scoring evaluation, case-insensitive comparison, and answer key confidentiality.
- `tests/analytics_dashboard.test.mjs`: Total study time, completion rates, and streak calculations.
- `tests/file_validation.test.mjs`: MIME type white-listing, 10MB size limits, and path traversal security.
- `tests/e2e_workflow.test.mjs`: Full end-to-end integration test against the running server (Registration -> AI Tutor -> Quiz Generation -> Exam Submission -> Planner -> Analytics).

---

## 🚢 Production Deployment (Supabase / Vercel / Railway)

### Database: PostgreSQL on Supabase or Neon
1. Create a PostgreSQL project on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy your connection string and set `DATABASE_URL` in your production environment variables:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
3. Update `provider = "postgresql"` in `prisma/schema.prisma` or execute the production DDL migration file located at:
   ```
   prisma/migrations/init_postgresql.sql
   ```
4. Run `npx prisma db push` to synchronize.

### Deployment on Vercel
1. Push your code to GitHub / GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. Configure the environment variables in the Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
4. Set Build Command: `npm run prisma:generate && next build`.
5. Deploy!

---

## 🛡️ Security & Privacy

- **Data Ownership:** Every query strictly scopes records to the authenticated user (`userId`).
- **No Client Secrets:** AI calls, API keys, and database queries are strictly executed on server-side route handlers.
- **Answer Key Protection:** The exam-taking endpoint (`GET /api/quizzes/[id]`) omits `correctAnswer` and `explanation`, ensuring integrity during active tests.
- **Secure File Storage:** Uploaded lecture materials are isolated in user-specific storage paths and verified against file size (10MB limit) and MIME type whitelists.
