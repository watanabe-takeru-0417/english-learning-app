import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// ─── AI Setup with Fallback ─────────────────────────

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
const model = geminiKey
  ? new GoogleGenerativeAI(geminiKey).getGenerativeModel({ model: "gemini-2.0-flash" })
  : null;

let useAI = !!model;

async function aiGenerate(prompt: string): Promise<string> {
  if (!model || !useAI) throw new Error("AI unavailable");
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("429") || msg.includes("503")) {
      console.warn("AI rate limited, falling back to mock data");
      useAI = false;
      // Retry AI after 60s
      setTimeout(() => { useAI = true; }, 60000);
    }
    throw e;
  }
}

function parseAIJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Mock Data (fallback when AI is unavailable) ────

const MOCK_EXERCISES: Record<string, Array<{id:number;japanese:string;english:string;grammar_point:string;hint:string}>> = {
  basic: [
    { id: 1, japanese: "私はエンジニアです。", english: "I am an engineer.", grammar_point: "SVO - be動詞", hint: "be動詞を使う" },
    { id: 2, japanese: "昨日ミーティングがありました。", english: "We had a meeting yesterday.", grammar_point: "過去形", hint: "had を使う" },
    { id: 3, japanese: "この問題を解決する必要があります。", english: "We need to solve this problem.", grammar_point: "need to + 動詞", hint: "need to" },
    { id: 4, japanese: "彼女はプロジェクトを管理しています。", english: "She is managing the project.", grammar_point: "現在進行形", hint: "is ~ing" },
    { id: 5, japanese: "レポートを明日までに提出してください。", english: "Please submit the report by tomorrow.", grammar_point: "命令文 + by", hint: "Please + 動詞" },
  ],
  business: [
    { id: 1, japanese: "その提案について検討させてください。", english: "Let me consider that proposal.", grammar_point: "Let me + 動詞", hint: "Let me" },
    { id: 2, japanese: "スケジュールを調整できますか？", english: "Can we adjust the schedule?", grammar_point: "Can we + 動詞", hint: "Can we" },
    { id: 3, japanese: "進捗状況を共有します。", english: "I'll share the progress update.", grammar_point: "未来形 will", hint: "I'll" },
    { id: 4, japanese: "予算内で対応可能です。", english: "We can handle it within the budget.", grammar_point: "within + 名詞", hint: "within" },
    { id: 5, japanese: "来週のデモに向けて準備しています。", english: "I'm preparing for the demo next week.", grammar_point: "prepare for", hint: "prepare for" },
  ],
  tech: [
    { id: 1, japanese: "このバグの原因を調査しています。", english: "I'm investigating the cause of this bug.", grammar_point: "現在進行形", hint: "investigate" },
    { id: 2, japanese: "本番環境にデプロイしました。", english: "I deployed to the production environment.", grammar_point: "過去形", hint: "deployed to" },
    { id: 3, japanese: "コードレビューをお願いできますか？", english: "Could you review my code?", grammar_point: "Could you + 動詞", hint: "Could you" },
    { id: 4, japanese: "APIのレスポンスが遅いです。", english: "The API response is slow.", grammar_point: "SVC", hint: "response is" },
    { id: 5, japanese: "テストカバレッジを改善する必要があります。", english: "We need to improve the test coverage.", grammar_point: "need to + 動詞", hint: "improve" },
  ],
  interview: [
    { id: 1, japanese: "自己紹介をお願いします。", english: "Please introduce yourself.", grammar_point: "命令文", hint: "introduce yourself" },
    { id: 2, japanese: "前職ではどのような経験をしましたか？", english: "What kind of experience did you have at your previous job?", grammar_point: "疑問詞 + 過去形", hint: "What kind of" },
    { id: 3, japanese: "チームでの役割について教えてください。", english: "Tell me about your role in the team.", grammar_point: "Tell me about", hint: "Tell me about" },
    { id: 4, japanese: "なぜ転職を考えていますか？", english: "Why are you considering a career change?", grammar_point: "Why + 現在進行形", hint: "considering" },
    { id: 5, japanese: "5年後の目標は何ですか？", english: "What are your goals for the next five years?", grammar_point: "What are + 名詞", hint: "goals for" },
  ],
};

const MOCK_VOCAB: Record<string, Array<{word:string;pronunciation:string;japanese:string;example:string;category:string}>> = {
  business: [
    { word: "stakeholder", pronunciation: "/ˈsteɪkˌhoʊldər/", japanese: "利害関係者", example: "We need to align with all stakeholders.", category: "business" },
    { word: "leverage", pronunciation: "/ˈlevərɪdʒ/", japanese: "活用する", example: "Let's leverage our existing infrastructure.", category: "business" },
    { word: "scalable", pronunciation: "/ˈskeɪləbl/", japanese: "拡張可能な", example: "We need a scalable solution.", category: "business" },
    { word: "deliverable", pronunciation: "/dɪˈlɪvərəbl/", japanese: "成果物", example: "The deliverables are due next Friday.", category: "business" },
    { word: "milestone", pronunciation: "/ˈmaɪlˌstoʊn/", japanese: "マイルストーン", example: "We hit an important milestone this quarter.", category: "business" },
  ],
  tech: [
    { word: "deploy", pronunciation: "/dɪˈplɔɪ/", japanese: "デプロイする", example: "We deploy to production every two weeks.", category: "tech" },
    { word: "refactor", pronunciation: "/riːˈfæktər/", japanese: "リファクタリングする", example: "I need to refactor this module.", category: "tech" },
    { word: "middleware", pronunciation: "/ˈmɪdlˌwɛr/", japanese: "ミドルウェア", example: "Add authentication middleware to the API.", category: "tech" },
    { word: "throughput", pronunciation: "/ˈθruːˌpʊt/", japanese: "スループット", example: "The system throughput has improved.", category: "tech" },
    { word: "latency", pronunciation: "/ˈleɪtənsi/", japanese: "遅延", example: "We reduced latency by 50%.", category: "tech" },
  ],
  interview: [
    { word: "collaborate", pronunciation: "/kəˈlæbəˌreɪt/", japanese: "協力する", example: "I collaborate closely with cross-functional teams.", category: "interview" },
    { word: "initiative", pronunciation: "/ɪˈnɪʃətɪv/", japanese: "主導権・取り組み", example: "I took the initiative to improve our CI/CD pipeline.", category: "interview" },
    { word: "adaptable", pronunciation: "/əˈdæptəbl/", japanese: "適応力のある", example: "I'm adaptable to new technologies and environments.", category: "interview" },
    { word: "accomplish", pronunciation: "/əˈkɑːmplɪʃ/", japanese: "達成する", example: "I accomplished the migration ahead of schedule.", category: "interview" },
    { word: "prioritize", pronunciation: "/praɪˈɔːrɪˌtaɪz/", japanese: "優先順位をつける", example: "I prioritize tasks based on business impact.", category: "interview" },
  ],
  daily: [
    { word: "deadline", pronunciation: "/ˈdedˌlaɪn/", japanese: "締め切り", example: "The deadline is end of this week.", category: "daily" },
    { word: "commute", pronunciation: "/kəˈmjuːt/", japanese: "通勤する", example: "My commute takes about 30 minutes.", category: "daily" },
    { word: "agenda", pronunciation: "/əˈdʒendə/", japanese: "議題", example: "Let's go over today's agenda.", category: "daily" },
    { word: "follow up", pronunciation: "/ˈfɑːloʊ ʌp/", japanese: "フォローアップする", example: "I'll follow up on that issue.", category: "daily" },
    { word: "sync", pronunciation: "/sɪŋk/", japanese: "同期・打ち合わせ", example: "Let's have a quick sync after lunch.", category: "daily" },
  ],
};

const MOCK_INTERVIEW: Record<string, Array<{question:string;model_answer:string;key_phrases:string[];japanese:string}>> = {
  "self-introduction": [
    { question: "Tell me about yourself.", model_answer: "I'm a software engineer with 6 years of experience specializing in simulation and digital twin technologies. I've worked on large-scale mobility projects using Unity and C#.", key_phrases: ["I specialize in", "I have X years of experience", "I've worked on"], japanese: "自己紹介をお願いします。" },
    { question: "What motivates you in your work?", model_answer: "I'm motivated by solving complex technical challenges and seeing the real-world impact of the systems I build.", key_phrases: ["I'm motivated by", "real-world impact", "technical challenges"], japanese: "仕事のモチベーションは何ですか？" },
  ],
  "technical-skills": [
    { question: "What programming languages are you proficient in?", model_answer: "I'm most proficient in C# and TypeScript. I also have experience with Python for data processing and automation.", key_phrases: ["I'm proficient in", "I also have experience with"], japanese: "得意なプログラミング言語は？" },
    { question: "How do you approach debugging a complex issue?", model_answer: "I start by reproducing the issue, then use logging and breakpoints to narrow down the root cause. I always write a test case to prevent regression.", key_phrases: ["reproduce the issue", "narrow down", "root cause", "prevent regression"], japanese: "複雑なバグにどうアプローチしますか？" },
  ],
  "project-experience": [
    { question: "Tell me about a challenging project you worked on.", model_answer: "I led the development of a mobility simulation platform that processed millions of vehicle trajectories. The main challenge was optimizing performance while maintaining accuracy.", key_phrases: ["I led the development", "The main challenge was", "optimizing performance"], japanese: "困難だったプロジェクトについて教えてください。" },
  ],
  "career-goals": [
    { question: "Where do you see yourself in five years?", model_answer: "I see myself leading a technical team at a global company, working on cutting-edge AI and simulation technologies.", key_phrases: ["I see myself", "leading a team", "cutting-edge"], japanese: "5年後のビジョンは？" },
  ],
  "behavioral": [
    { question: "Tell me about a time you disagreed with a teammate.", model_answer: "I had a disagreement about architecture choices. I proposed we prototype both approaches and compare results objectively, which resolved the conflict.", key_phrases: ["I proposed", "compare objectively", "resolved the conflict"], japanese: "チームメイトと意見が合わなかった経験は？" },
  ],
};

// ─── Translation Drill ───────────────────────────────

app.post("/api/drill/translation", async (req, res) => {
  const { category, difficulty, count } = req.body;

  // Try AI first
  try {
    const prompt = `Generate ${count} Japanese-to-English translation exercises for the category "${category}" at ${difficulty} level.
Target: Japanese professional learning English for foreign companies (外資系企業).
Return a JSON array: [{"id":1,"japanese":"日本語","english":"English","grammar_point":"grammar","hint":"hint"}]
Return ONLY the JSON array.`;
    const result = await aiGenerate(prompt);
    const exercises = parseAIJson(result);
    res.json({ exercises, source: "ai" });
    return;
  } catch { /* fallback below */ }

  // Fallback to mock
  const pool = MOCK_EXERCISES[category] || MOCK_EXERCISES.basic;
  const exercises = pool.slice(0, count || 5);
  res.json({ exercises, source: "mock" });
});

app.post("/api/drill/evaluate", async (req, res) => {
  const { japanese, userAnswer, expected } = req.body;

  try {
    const prompt = `Evaluate this English translation by a Japanese learner.
Japanese: ${japanese} | Expected: ${expected} | User: ${userAnswer}
Return JSON: {"score":(1-10),"is_correct":bool,"feedback":"Japanese feedback","corrections":[],"better_alternatives":[]}
Return ONLY JSON.`;
    const result = await aiGenerate(prompt);
    res.json(parseAIJson(result));
    return;
  } catch { /* fallback */ }

  // Simple string comparison fallback
  const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const isCorrect = normalized(userAnswer) === normalized(expected);
  const score = isCorrect ? 10 : (normalized(userAnswer).split(" ").filter(w => normalized(expected).includes(w)).length / normalized(expected).split(" ").length) * 10;
  res.json({
    score: Math.round(score),
    is_correct: score >= 7,
    feedback: score >= 7 ? "よくできました！" : "もう少し頑張りましょう。模範解答を確認してください。",
    corrections: isCorrect ? [] : [`模範解答: ${expected}`],
    better_alternatives: [expected],
  });
});

// ─── Vocabulary ──────────────────────────────────────

app.post("/api/vocab/list", async (req, res) => {
  const { category, count } = req.body;

  try {
    const prompt = `Generate ${count} English vocabulary words for "${category}".
Target: Japanese tech professional.
Return JSON array: [{"word":"","pronunciation":"","japanese":"","example":"","category":"${category}"}]
Return ONLY JSON.`;
    const result = await aiGenerate(prompt);
    res.json({ words: parseAIJson(result), source: "ai" });
    return;
  } catch { /* fallback */ }

  const pool = MOCK_VOCAB[category] || MOCK_VOCAB.business;
  res.json({ words: pool.slice(0, count || 10), source: "mock" });
});

// ─── Mock Interview ──────────────────────────────────

app.post("/api/interview/questions", async (req, res) => {
  const { topic, count } = req.body;

  try {
    const prompt = `Generate ${count} English job interview questions for topic "${topic}".
Target: Japanese software engineer for foreign tech companies.
Return JSON: [{"question":"","model_answer":"","key_phrases":[],"japanese":""}]
Return ONLY JSON.`;
    const result = await aiGenerate(prompt);
    res.json({ questions: parseAIJson(result), source: "ai" });
    return;
  } catch { /* fallback */ }

  const pool = MOCK_INTERVIEW[topic] || MOCK_INTERVIEW["self-introduction"];
  res.json({ questions: pool.slice(0, count || 3), source: "mock" });
});

app.post("/api/interview/evaluate", async (req, res) => {
  const { question, answer } = req.body;

  try {
    const prompt = `Evaluate interview answer. Q: ${question} A: ${answer}
Return JSON: {"score":(1-10),"good_points":[],"improvements":[],"corrected_answer":"","feedback_ja":""}
Return ONLY JSON.`;
    const result = await aiGenerate(prompt);
    res.json(parseAIJson(result));
    return;
  } catch { /* fallback */ }

  const wordCount = answer.split(" ").length;
  const score = Math.min(10, Math.max(3, Math.round(wordCount / 3)));
  res.json({
    score,
    good_points: wordCount > 10 ? ["Good length and detail"] : ["Answered the question"],
    improvements: wordCount < 15 ? ["Try to give more specific examples", "Use the STAR method"] : ["Consider adding more concrete numbers"],
    corrected_answer: answer,
    feedback_ja: wordCount > 10 ? "ある程度の内容量がありますが、具体例を追加するとさらに良くなります。" : "もう少し詳しく回答すると印象が良くなります。STAR法を意識してみましょう。",
  });
});

// ─── Health Check ────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ai_available: useAI, ai_provider: model ? "gemini" : "mock" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`AI: ${model ? "Gemini (with mock fallback)" : "Mock only"}`);
});
