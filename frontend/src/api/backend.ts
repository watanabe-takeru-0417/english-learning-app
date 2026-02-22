const API_BASE = "http://localhost:3001/api";

export async function apiCall<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // 瞬間英作文
  getTranslationDrill: (category: string, difficulty: string, count: number) =>
    apiCall<{ exercises: TranslationExercise[] }>("/drill/translation", {
      category,
      difficulty,
      count,
    }),

  evaluateTranslation: (japanese: string, userAnswer: string, expected: string) =>
    apiCall<EvaluationResult>("/drill/evaluate", {
      japanese,
      userAnswer,
      expected,
    }),

  // 語彙
  getVocabulary: (category: string, count: number) =>
    apiCall<{ words: VocabWord[] }>("/vocab/list", { category, count }),

  // 模擬面接
  getInterviewQuestions: (topic: string, count: number) =>
    apiCall<{ questions: InterviewQuestion[] }>("/interview/questions", {
      topic,
      count,
    }),

  evaluateInterview: (question: string, answer: string) =>
    apiCall<InterviewFeedback>("/interview/evaluate", { question, answer }),
};

// Types
export interface TranslationExercise {
  id: number;
  japanese: string;
  english: string;
  grammar_point: string;
  hint?: string;
}

export interface EvaluationResult {
  score: number;
  is_correct: boolean;
  feedback: string;
  corrections: string[];
  better_alternatives: string[];
}

export interface VocabWord {
  word: string;
  pronunciation: string;
  japanese: string;
  example: string;
  category: string;
}

export interface InterviewQuestion {
  question: string;
  model_answer: string;
  key_phrases: string[];
  japanese: string;
}

export interface InterviewFeedback {
  score: number;
  good_points: string[];
  improvements: string[];
  corrected_answer: string;
  feedback_ja: string;
}
