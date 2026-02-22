import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!geminiKey) {
  console.error("GOOGLE_GEMINI_API_KEY is required in .env");
  process.exit(1);
}

const model = new GoogleGenerativeAI(geminiKey).getGenerativeModel({
  model: "gemini-2.0-flash",
});

async function aiGenerate(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function parseAIJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Translation Drill ───────────────────────────────

app.post("/api/drill/translation", async (req, res) => {
  const { category, difficulty, count } = req.body;
  const prompt = `Generate ${count} Japanese-to-English translation exercises for the category "${category}" at ${difficulty} level.

Target: Japanese professional learning English for foreign companies (外資系企業).

Return a JSON array with this structure:
[{
  "id": 1,
  "japanese": "日本語の文",
  "english": "Expected English translation",
  "grammar_point": "Key grammar concept",
  "hint": "A helpful hint"
}]

Categories:
- basic: Basic grammar (SVO, tenses, questions, prepositions)
- business: Business expressions (meetings, emails, negotiations)
- tech: Technical English (software development, engineering)
- interview: Job interview phrases

Return ONLY the JSON array, no other text.`;

  try {
    const result = await aiGenerate(prompt);
    const exercises = parseAIJson(result);
    res.json({ exercises });
  } catch (e) {
    console.error("Translation drill error:", e);
    res.status(500).json({ error: "Failed to generate exercises" });
  }
});

app.post("/api/drill/evaluate", async (req, res) => {
  const { japanese, userAnswer, expected } = req.body;
  const prompt = `Evaluate this English translation by a Japanese learner.

Japanese original: ${japanese}
Expected answer: ${expected}
User's answer: ${userAnswer}

Return a JSON object:
{
  "score": (1-10),
  "is_correct": true/false (true if score >= 7),
  "feedback": "Brief feedback in Japanese",
  "corrections": ["list of specific grammar/word corrections"],
  "better_alternatives": ["other natural ways to say this"]
}

Return ONLY the JSON, no other text.`;

  try {
    const result = await aiGenerate(prompt);
    const evaluation = parseAIJson(result);
    res.json(evaluation);
  } catch (e) {
    console.error("Evaluation error:", e);
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

// ─── Vocabulary ──────────────────────────────────────

app.post("/api/vocab/list", async (req, res) => {
  const { category, count } = req.body;
  const prompt = `Generate ${count} English vocabulary words for the "${category}" category.

Target: Japanese professional working in tech, preparing for foreign companies.

Return a JSON array:
[{
  "word": "English word",
  "pronunciation": "/prəˌnʌnsiˈeɪʃən/",
  "japanese": "日本語訳",
  "example": "Example sentence using the word",
  "category": "${category}"
}]

Categories:
- business: Business vocabulary (strategy, stakeholder, leverage, etc.)
- tech: Tech vocabulary (deploy, scalable, middleware, etc.)
- interview: Interview vocabulary (leadership, initiative, collaborate, etc.)
- daily: Daily office vocabulary (deadline, commute, agenda, etc.)

Return ONLY the JSON array.`;

  try {
    const result = await aiGenerate(prompt);
    const words = parseAIJson(result);
    res.json({ words });
  } catch (e) {
    console.error("Vocab error:", e);
    res.status(500).json({ error: "Failed to generate vocabulary" });
  }
});

// ─── Mock Interview ──────────────────────────────────

app.post("/api/interview/questions", async (req, res) => {
  const { topic, count } = req.body;
  const prompt = `Generate ${count} English job interview questions for a tech company.

Topic: ${topic}
Target: Japanese software engineer applying to foreign tech companies.

Return a JSON array:
[{
  "question": "The interview question in English",
  "model_answer": "A model answer (2-3 sentences)",
  "key_phrases": ["useful phrases for answering"],
  "japanese": "質問の日本語訳"
}]

Topics:
- self-introduction: Tell me about yourself, background
- technical-skills: Technical skills, tools, languages
- project-experience: Past projects, achievements, challenges
- career-goals: Future plans, motivation, why this company
- behavioral: Teamwork, conflict resolution, leadership

Return ONLY the JSON array.`;

  try {
    const result = await aiGenerate(prompt);
    const questions = parseAIJson(result);
    res.json({ questions });
  } catch (e) {
    console.error("Interview questions error:", e);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

app.post("/api/interview/evaluate", async (req, res) => {
  const { question, answer } = req.body;
  const prompt = `Evaluate this job interview answer by a Japanese tech professional.

Question: ${question}
User's answer: ${answer}

Return a JSON object:
{
  "score": (1-10),
  "good_points": ["what was good about the answer"],
  "improvements": ["specific suggestions for improvement"],
  "corrected_answer": "An improved version of their answer",
  "feedback_ja": "日本語での詳細フィードバック"
}

Return ONLY the JSON.`;

  try {
    const result = await aiGenerate(prompt);
    const feedback = parseAIJson(result);
    res.json(feedback);
  } catch (e) {
    console.error("Interview evaluation error:", e);
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

// ─── Health Check ────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ai_provider: "gemini" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log("AI provider: Gemini (free tier)");
});
