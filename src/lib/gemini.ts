import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Schema definitions for AI outputs
export const QuizGeneratedSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      questionType: z.enum(["multiple_choice", "true_false", "identification", "short_answer"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
    })
  ),
});

export const SummaryGeneratedSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyConcepts: z.array(
    z.object({
      concept: z.string(),
      definition: z.string(),
    })
  ),
  keyTerms: z.array(z.string()),
  reviewerNotes: z.array(z.string()),
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  practiceQuestions: z.array(
    z.object({
      question: z.string(),
      questionType: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
    })
  ),
});

export const FlashcardSetGeneratedSchema = z.object({
  title: z.string(),
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

export interface TutorMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface TutorOptions {
  prompt: string;
  subject?: string;
  educationLevel?: string;
  responseMode?:
    | "simple"
    | "detailed"
    | "step_by_step"
    | "example"
    | "quiz_me"
    | "socratic";
  history?: TutorMessage[];
  documentContext?: string;
  apiKey?: string;
}

export interface SummarizeOptions {
  content: string;
  subject?: string;
  educationLevel?: string;
  apiKey?: string;
}

export interface QuizGenerateOptions {
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  questionTypes: string[];
  documentContext?: string;
  apiKey?: string;
}

export interface FlashcardsGenerateOptions {
  subject: string;
  topic: string;
  content?: string;
  count?: number;
  apiKey?: string;
}

export interface StudyPlanOptions {
  tasks: Array<{ title: string; dueDate?: string | null; priority: string; status: string }>;
  quizScores: Array<{ title: string; score: number; total: number }>;
  studyHoursTotal: number;
  educationLevel?: string;
  apiKey?: string;
}

/**
 * Clean Markdown code fence if model returned ```json ... ```
 */
function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

/**
 * Determine AI Provider from explicit key or environment variables
 */
function resolveProvider(userKey?: string): {
  provider: "groq" | "openai" | "openrouter" | "gemini" | "none";
  key: string;
} {
  const candidate = (
    userKey ||
    process.env.GROQ_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    ""
  ).trim();

  if (!candidate) {
    return { provider: "none", key: "" };
  }

  if (candidate.startsWith("gsk_")) {
    return { provider: "groq", key: candidate };
  }
  if (candidate.startsWith("sk-or-")) {
    return { provider: "openrouter", key: candidate };
  }
  if (candidate.startsWith("sk-")) {
    return { provider: "openai", key: candidate };
  }
  if (candidate.startsWith("AIzaSy")) {
    return { provider: "gemini", key: candidate };
  }

  // Fallback heuristic: long keys are likely Gemini or OpenAI
  if (candidate.length >= 35) {
    return { provider: "gemini", key: candidate };
  }

  return { provider: "groq", key: candidate };
}

/**
 * Universal LLM Completion Engine supporting Groq, Gemini, OpenAI & OpenRouter
 */
async function callUniversalLLM(options: {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  userKey?: string;
  jsonMode?: boolean;
}): Promise<string | null> {
  const resolved = resolveProvider(options.userKey);

  // 1. Groq Provider
  if (resolved.provider === "groq") {
    const groqModels = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"];
    const groqMessages = [
      { role: "system", content: options.systemPrompt },
      ...options.messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    for (const model of groqModels) {
      try {
        const payload: Record<string, unknown> = {
          model,
          messages: groqMessages,
          temperature: 0.7,
        };
        if (options.jsonMode) {
          payload.response_format = { type: "json_object" };
        }

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resolved.key}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.choices?.[0]?.message?.content;
          if (text) return text;
        }
      } catch (err) {
        console.warn(`Groq model ${model} attempt failed:`, err);
      }
    }
  }

  // 2. OpenAI Provider
  if (resolved.provider === "openai") {
    try {
      const payload: Record<string, unknown> = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: options.systemPrompt },
          ...options.messages,
        ],
        temperature: 0.7,
      };
      if (options.jsonMode) {
        payload.response_format = { type: "json_object" };
      }

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolved.key}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      console.warn("OpenAI call failed:", err);
    }
  }

  // 3. OpenRouter Provider
  if (resolved.provider === "openrouter") {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolved.key}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: options.systemPrompt },
            ...options.messages,
          ],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      console.warn("OpenRouter call failed:", err);
    }
  }

  // 4. Google Gemini Provider
  if (resolved.provider === "gemini") {
    try {
      const client = new GoogleGenerativeAI(resolved.key);
      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: options.systemPrompt,
        generationConfig: options.jsonMode ? { responseMimeType: "application/json" } : undefined,
      });

      let promptText = "";
      for (const msg of options.messages) {
        promptText += `${msg.role === "assistant" ? "Tutor" : "Student"}: ${msg.content}\n`;
      }

      const result = await model.generateContent(promptText);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      console.warn("Gemini call failed:", err);
    }
  }

  return null;
}

/**
 * 1. AI ACADEMIC TUTOR
 */
export async function academicTutor(options: TutorOptions): Promise<{
  text: string;
  suggestedFollowUps: string[];
}> {
  const modeInstructions: Record<string, string> = {
    simple: "Explain with maximum conciseness. State the core concept immediately in 2-4 punchy bullet points with a clear, intuitive analogy. Keep under 150 words.",
    detailed: "Provide an academically rigorous, compact breakdown. State definitions, governing formulas, and key mechanisms in concise sections. No filler.",
    step_by_step: "Break down into concise, numbered sequential steps. Show the essential formula and calculation for each step without unnecessary narrative text.",
    example: "Provide one concrete, high-yield real-world example or worked case study. Explain the practical takeaway in 2-3 bullet points.",
    quiz_me: "Pose 1 concise practice exam question (multiple choice or prompt). Provide the correct answer and brief rationale inside a spoiler/section.",
    socratic: "Ask 2 targeted guiding diagnostic questions that help the student deduce the solution from first principles. Keep it under 100 words.",
  };

  const selectedModePrompt =
    modeInstructions[options.responseMode || "simple"] || modeInstructions.simple;

  const systemPrompt = `You are AI StudyMate, an ultra-sharp, concise college academic tutor.
Student Level: ${options.educationLevel || "College / University"}
Subject: ${options.subject || "General Academic Studies"}
Pedagogical Mode: ${options.responseMode || "simple"}
Mode Requirement: ${selectedModePrompt}

CRITICAL RULES FOR CONCISENESS & LANGUAGE:
1. STRICT ZERO FLUFF: NEVER include conversational preambles, greetings, or filler (e.g. NEVER say "Hey there!", "Sure thing!", "Let's untangle this", "I'll keep it conversational", "I hope this helps!").
2. DIRECT ANSWER FIRST: Begin immediately with the core answer, formula, or definition.
3. LANGUAGE MATCHING (ENGLISH, TAGALOG, BISAYA): Full native support for Tagalog / Filipino and Bisaya / Cebuano. If the student asks in Tagalog or Bisaya, or asks to explain in either language, reply in that exact language with natural, fluent academic explanations while keeping terms and math accurate.
4. HIGH-YIELD FORMATTING: Use bold key terms, compact bullet points, and summary tables or equations where applicable. Make it effortless to skim and understand on a mobile phone.
5. Clean LaTeX math: inline with $...$ or block display with $$...$$.
6. Code: short, clean fenced code blocks with language tag.
7. At the very end, include exactly 3 concise follow-up questions under:
### Suggested Next Questions
- [Concise follow-up 1]
- [Concise follow-up 2]
- [Concise follow-up 3]`;

  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

  if (options.documentContext) {
    messages.push({
      role: "system",
      content: `[DOCUMENT CONTEXT FROM STUDENT LESSON]:\n${options.documentContext.slice(0, 8000)}`,
    });
  }

  if (options.history && options.history.length > 0) {
    for (const h of options.history.slice(-8)) {
      messages.push({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      });
    }
  }

  messages.push({ role: "user", content: options.prompt });

  const aiResponse = await callUniversalLLM({
    systemPrompt,
    messages,
    userKey: options.apiKey,
    jsonMode: false,
  });

  if (aiResponse) {
    const followUps: string[] = [];
    const followUpMatch = aiResponse.match(/### Suggested Next Questions[\s\S]*$/i);
    if (followUpMatch) {
      const lines = followUpMatch[0]
        .split("\n")
        .filter((l) => l.trim().startsWith("-") || /^\d+\./.test(l.trim()));
      lines.forEach((l) =>
        followUps.push(l.replace(/^[-*]|\d+\.\s*/, "").trim())
      );
    }

    return {
      text: aiResponse,
      suggestedFollowUps:
        followUps.length > 0
          ? followUps.slice(0, 3)
          : [
              "Can you give me another practice example of this?",
              "How would a college exam question test this concept?",
              "Can you explain the intuition behind this step?",
            ],
    };
  }

  // If completely offline or API unreachable, provide an intelligent, dynamic fallback
  return getOfflineTutorFallback(options);
}

/**
 * 2. AI NOTES SUMMARIZER
 */
export async function summarizeNotes(
  options: SummarizeOptions
): Promise<z.infer<typeof SummaryGeneratedSchema>> {
  const systemPrompt = `You are AI StudyMate's Academic Summarizer.
Analyze the provided student lesson/lecture notes.
Student Level: ${options.educationLevel || "College / University"}
Subject: ${options.subject || "General Academic"}

You must return a strictly valid JSON object matching this schema (do NOT wrap in extra prose, return raw JSON):
{
  "title": "Descriptive Academic Title",
  "summary": "Concise 2-3 paragraph academic synthesis of the material",
  "keyConcepts": [
    { "concept": "Concept Name", "definition": "Clear concise definition" }
  ],
  "keyTerms": ["Term 1", "Term 2", "Term 3", "Term 4"],
  "reviewerNotes": [
    "High-yield exam review bullet point 1",
    "High-yield exam review bullet point 2",
    "High-yield exam review bullet point 3"
  ],
  "flashcards": [
    { "question": "Question text", "answer": "Answer text" }
  ],
  "practiceQuestions": [
    {
      "question": "Question text",
      "questionType": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option",
      "explanation": "Why this is correct"
    }
  ]
}`;

  const promptText = `NOTES CONTENT TO SUMMARIZE:\n${options.content.slice(0, 15000)}`;

  try {
    const raw = await callUniversalLLM({
      systemPrompt,
      messages: [{ role: "user", content: promptText }],
      userKey: options.apiKey,
      jsonMode: true,
    });

    if (raw) {
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return SummaryGeneratedSchema.parse(parsed);
    }
  } catch (err) {
    console.warn("Universal summarization error, using fallback:", err);
  }

  // Graceful fallback
  return {
    title: options.subject ? `${options.subject} Study Summary` : "Academic Notes Summary",
    summary: `Comprehensive summary of the provided lesson notes for ${options.subject || "the subject"}. The material establishes key theoretical foundations, core mechanisms, and analytical frameworks. Understanding these principles allows students to connect theoretical models to practical problem solving.`,
    keyConcepts: [
      {
        concept: "Core Principle",
        definition: "The fundamental rule or law underlying this academic topic.",
      },
      {
        concept: "Methodology",
        definition: "The systematic, theoretical analysis of the methods applied to this field of study.",
      },
      {
        concept: "Practical Application",
        definition: "How this concept is executed or evaluated in examinations and real-world scenarios.",
      },
    ],
    keyTerms: ["Foundation", "Hypothesis", "Analysis", "Synthesis", "Evaluation"],
    reviewerNotes: [
      "Review the primary definitions and formulas first before tackling problem sets.",
      "Pay special attention to edge cases and contrasting concepts.",
      "Practice active recall by testing yourself on the extracted flashcards.",
    ],
    flashcards: [
      {
        question: `What is the primary objective of studying ${options.subject || "this topic"}?`,
        answer: "To understand the core mechanisms, theoretical models, and practical analytical methods.",
      },
      {
        question: "How do you distinguish foundational rules from secondary effects?",
        answer: "Foundational rules govern primary behavior, while secondary effects arise under specific boundary conditions.",
      },
    ],
    practiceQuestions: [
      {
        question: `Which statement best describes the primary takeaway of ${options.subject || "the lesson"}?`,
        questionType: "multiple_choice",
        options: [
          "It establishes foundational principles for analytical inquiry.",
          "It invalidates previous classical theories unconditionally.",
          "It is only relevant for theoretical simulations.",
          "None of the above.",
        ],
        correctAnswer: "It establishes foundational principles for analytical inquiry.",
        explanation: "The core lesson emphasizes the foundational understanding necessary for subsequent applications.",
      },
    ],
  };
}

/**
 * 3. AI QUIZ AND EXAMINATION GENERATOR
 */
export async function generateQuiz(
  options: QuizGenerateOptions
): Promise<z.infer<typeof QuizGeneratedSchema>> {
  const systemPrompt = `You are an expert exam creator for AI StudyMate.
Generate a high-yield academic practice exam on:
Subject: ${options.subject}
Topic: ${options.topic}
Difficulty: ${options.difficulty} (easy, medium, hard)
Question Count: ${options.questionCount}
Supported Question Types: ${options.questionTypes.join(", ")}
${options.documentContext ? `Context Lesson Material:\n${options.documentContext.slice(0, 10000)}` : ""}

Requirements:
- Strict academic accuracy.
- For 'multiple_choice', provide exactly 4 clear options.
- For 'true_false', options must be ["True", "False"].
- For 'identification', correctAnswer must be the exact keyword/phrase.
- For 'short_answer', correctAnswer must be a concise, accurate 1-2 sentence standard answer.
- Always include a clear pedagogical explanation.
- Return ONLY valid JSON matching this schema:
{
  "title": "Title of Quiz",
  "questions": [
    {
      "question": "The question text",
      "questionType": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}`;

  try {
    const raw = await callUniversalLLM({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate ${options.questionCount} practice questions for ${options.subject}: ${options.topic}.`,
        },
      ],
      userKey: options.apiKey,
      jsonMode: true,
    });

    if (raw) {
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return QuizGeneratedSchema.parse(parsed);
    }
  } catch (err) {
    console.warn("Universal quiz generation failed, using fallback:", err);
  }

  const fallbackQuestions = [
    {
      question: `In ${options.subject}, what is the foundational concept behind ${options.topic}?`,
      questionType: "multiple_choice" as const,
      options: [
        "It defines the basic governing principles of the system",
        "It describes an isolated anomaly",
        "It is only applicable in theoretical models",
        "It contradicts fundamental empirical observations",
      ],
      correctAnswer: "It defines the basic governing principles of the system",
      explanation: "Foundational principles establish the rules and relationships under which other phenomena are analyzed.",
    },
    {
      question: `True or False: The principles of ${options.topic} can be systematically verified through empirical analysis or logical proof.`,
      questionType: "true_false" as const,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Academic principles are established through rigorous proof, experiment, or structured methodology.",
    },
    {
      question: `Define the term that describes the primary operational unit or variable in ${options.topic}.`,
      questionType: "identification" as const,
      options: [],
      correctAnswer: "Core Variable",
      explanation: "The core variable represents the fundamental measurable or logical unit in the study of this topic.",
    },
  ];

  return {
    title: `${options.subject}: ${options.topic} Practice Examination`,
    questions: fallbackQuestions.slice(0, Math.max(1, options.questionCount || 3)),
  };
}

/**
 * 4. FLASHCARD GENERATOR
 */
export async function generateFlashcards(
  options: FlashcardsGenerateOptions
): Promise<z.infer<typeof FlashcardSetGeneratedSchema>> {
  const systemPrompt = `You are an active recall flashcard creator.
Create ${options.count || 5} high-yield flashcards for:
Subject: ${options.subject}
Topic: ${options.topic}
${options.content ? `Material:\n${options.content.slice(0, 8000)}` : ""}

Return ONLY JSON:
{
  "title": "Set Title",
  "flashcards": [
    {
      "question": "Clear, direct front-of-card question or prompt",
      "answer": "Concise, precise back-of-card answer"
    }
  ]
}`;

  try {
    const raw = await callUniversalLLM({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate ${options.count || 5} flashcards for ${options.subject}: ${options.topic}`,
        },
      ],
      userKey: options.apiKey,
      jsonMode: true,
    });

    if (raw) {
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return FlashcardSetGeneratedSchema.parse(parsed);
    }
  } catch (err) {
    console.warn("Universal flashcards generation error:", err);
  }

  return {
    title: `${options.subject} - ${options.topic} Flashcards`,
    flashcards: [
      {
        question: `What is the primary definition of ${options.topic}?`,
        answer: `The fundamental concept in ${options.subject} governing its primary rules and applications.`,
      },
      {
        question: `Name two key properties of ${options.topic}.`,
        answer: `1. Consistency with core axioms.\n2. Reproducibility in problem-solving.`,
      },
      {
        question: `Why is ${options.topic} essential in ${options.subject}?`,
        answer: `It provides the theoretical framework needed to solve advanced problems and make accurate predictions.`,
      },
    ],
  };
}

/**
 * 5. DOCUMENT & IMAGE ASSISTANCE
 */
export async function explainDocument(options: {
  documentText: string;
  question?: string;
  educationLevel?: string;
  apiKey?: string;
}): Promise<string> {
  const systemPrompt = `You are AI StudyMate's Academic Document Assistant.
Student Level: ${options.educationLevel || "College / University"}
Your goal is to thoroughly analyze, summarize, and explain lesson materials provided by the student.`;

  const userPrompt = `${options.question ? `Student Question: ${options.question}\n\n` : "Please explain and summarize the key academic insights of this document:\n\n"}DOCUMENT CONTENT:\n${options.documentText.slice(0, 15000)}`;

  try {
    const raw = await callUniversalLLM({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      userKey: options.apiKey,
      jsonMode: false,
    });

    if (raw) return raw;
  } catch (err) {
    console.warn("Universal document explanation failed:", err);
  }

  return `### Document Analysis Summary\n\n` +
    `**Extracted Text Overview:**\n` +
    `${options.documentText.slice(0, 300)}...\n\n` +
    `*Key Takeaways:*\n` +
    `- The document presents academic lesson material structured for ${options.educationLevel || "college"} level comprehension.\n` +
    `- You can generate practice examinations, flashcards, or ask specific follow-up questions about this document.`;
}

/**
 * 6. RECOMMEND STUDY PLAN
 */
export async function recommendStudyPlan(options: StudyPlanOptions): Promise<{
  focusSubject: string;
  recommendedActions: string[];
  motivationalNote: string;
}> {
  const systemPrompt = `You are AI StudyMate's Academic Productivity Coach.
Analyze the student's current tasks and quiz history to generate customized high-yield study advice.
Return ONLY valid JSON:
{
  "focusSubject": "Subject needing most attention",
  "recommendedActions": ["Action item 1", "Action item 2", "Action item 3"],
  "motivationalNote": "1-2 sentence inspiring, constructive message"
}`;

  const prompt = `Student stats:
Tasks pending: ${options.tasks.length}
Quiz attempts: ${JSON.stringify(options.quizScores.slice(0, 5))}
Total study hours: ${(options.studyHoursTotal / 60).toFixed(1)} hrs`;

  try {
    const raw = await callUniversalLLM({
      systemPrompt,
      messages: [{ role: "user", content: prompt }],
      userKey: options.apiKey,
      jsonMode: true,
    });

    if (raw) {
      const parsed = JSON.parse(cleanJsonOutput(raw));
      return {
        focusSubject: parsed.focusSubject || "Core Academic Focus",
        recommendedActions: parsed.recommendedActions || [],
        motivationalNote: parsed.motivationalNote || "Keep up the consistent momentum!",
      };
    }
  } catch (e) {
    console.warn("Study plan recommendation fallback:", e);
  }

  return {
    focusSubject: "Mathematics & Analytical Sciences",
    recommendedActions: [
      "Dedicate 25 minutes of focused Pomodoro active recall to your lowest-scoring topics.",
      "Review incorrect quiz questions before attempting the next practice exam.",
      "Complete pending assignments with due dates in the next 48 hours first.",
    ],
    motivationalNote:
      "Consistent 30-minute daily sessions lead to significantly higher retention than overnight cramming. Keep up the great work!",
  };
}

/**
 * Intelligent Offline Pedagogical Fallback
 */
function getOfflineTutorFallback(options: TutorOptions): {
  text: string;
  suggestedFollowUps: string[];
} {
  const p = options.prompt.toLowerCase();
  let explanation = "";

  if (p.includes("derivative") || p.includes("calculus") || p.includes("integral") || p.includes("math")) {
    explanation = `### Step-by-Step Mathematical Analysis: ${options.prompt}

1. **Foundational Rule (Power Rule & Chain Rule):**
   $$\\frac{d}{dx}[x^n] = n x^{n-1}, \\qquad \\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$$

2. **Systematic Solution Strategy:**
   - **Step 1:** Identify the outer function and the inner composite function.
   - **Step 2:** Apply differentiation rules term by term.
   - **Step 3:** Factor and simplify like terms.

3. **Verification:**
   Check edge cases at $x = 0$ or critical points where the derivative vanishes ($f'(x) = 0$).`;
  } else {
    explanation = `### Academic Guidance: ${options.prompt}

**Subject Focus:** ${options.subject || "College Academic Studies"}

#### 1. Core Principles
Understanding **"${options.prompt}"** requires connecting underlying definitions with observable behavior.

#### 2. Examination Strategy
- Break down complex multi-part questions into individual knowns and unknowns.
- Always state the governing law or theorem before performing calculations or arguments.

> 💡 **Study Mate Tip:** Feel free to ask me to solve any specific problem set, give a real-world example, or quiz you on this topic!`;
  }

  return {
    text: explanation,
    suggestedFollowUps: [
      `Can you give me a step-by-step example problem on this?`,
      `How would this be tested on a college exam?`,
      `Can you quiz me on this topic to test my understanding?`,
    ],
  };
}
