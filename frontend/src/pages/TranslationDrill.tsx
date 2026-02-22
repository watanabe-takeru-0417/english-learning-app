import { useState } from "react";
import { api, TranslationExercise, EvaluationResult } from "../api/backend";

const CATEGORIES = [
  { id: "basic", label: "基本文法" },
  { id: "business", label: "ビジネス表現" },
  { id: "tech", label: "技術英語" },
  { id: "interview", label: "面接対策" },
];

const DIFFICULTIES = [
  { id: "beginner", label: "初級" },
  { id: "intermediate", label: "中級" },
  { id: "advanced", label: "上級" },
];

export default function TranslationDrill() {
  const [category, setCategory] = useState("basic");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [exercises, setExercises] = useState<TranslationExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const startDrill = async () => {
    setLoading(true);
    try {
      const data = await api.getTranslationDrill(category, difficulty, 10);
      setExercises(data.exercises);
      setCurrentIndex(0);
      setScore({ correct: 0, total: 0 });
      setEvaluation(null);
      setUserAnswer("");
    } catch {
      alert("問題の取得に失敗しました。バックエンドが起動しているか確認してください。");
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    try {
      const exercise = exercises[currentIndex];
      const result = await api.evaluateTranslation(
        exercise.japanese,
        userAnswer,
        exercise.english
      );
      setEvaluation(result);
      setScore((prev) => ({
        correct: prev.correct + (result.is_correct ? 1 : 0),
        total: prev.total + 1,
      }));
    } catch {
      alert("評価に失敗しました。");
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    setCurrentIndex((prev) => prev + 1);
    setUserAnswer("");
    setEvaluation(null);
    setShowHint(false);
  };

  const current = exercises[currentIndex];
  const isFinished = exercises.length > 0 && currentIndex >= exercises.length;

  return (
    <div className="drill-page">
      <h2>⚡ 瞬間英作文</h2>

      {exercises.length === 0 && (
        <div className="drill-setup">
          <div className="option-group">
            <label>カテゴリ</label>
            <div className="button-group">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={category === c.id ? "active" : ""}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <label>難易度</label>
            <div className="button-group">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  className={difficulty === d.id ? "active" : ""}
                  onClick={() => setDifficulty(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={startDrill} disabled={loading}>
            {loading ? "読み込み中..." : "スタート"}
          </button>
        </div>
      )}

      {current && !isFinished && (
        <div className="drill-active">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentIndex + 1) / exercises.length) * 100}%`,
              }}
            />
          </div>
          <span className="progress-text">
            {currentIndex + 1} / {exercises.length}
          </span>

          <div className="question-card">
            <p className="question-label">日本語:</p>
            <p className="question-text">{current.japanese}</p>

            {showHint && current.hint && (
              <p className="hint">💡 ヒント: {current.hint}</p>
            )}
            {showHint && current.grammar_point && (
              <p className="hint">📝 文法ポイント: {current.grammar_point}</p>
            )}

            {!evaluation && (
              <>
                <textarea
                  className="answer-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="英語で入力..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                />
                <div className="action-row">
                  <button
                    className="btn-hint"
                    onClick={() => setShowHint(true)}
                  >
                    ヒント
                  </button>
                  <button
                    className="btn-primary"
                    onClick={submitAnswer}
                    disabled={loading || !userAnswer.trim()}
                  >
                    {loading ? "判定中..." : "回答する"}
                  </button>
                </div>
              </>
            )}

            {evaluation && (
              <div className={`evaluation ${evaluation.is_correct ? "correct" : "incorrect"}`}>
                <p className="eval-score">
                  {evaluation.is_correct ? "✅ 正解!" : "❌ 惜しい!"} (スコア: {evaluation.score}/10)
                </p>
                <p className="eval-feedback">{evaluation.feedback}</p>

                {evaluation.corrections.length > 0 && (
                  <div className="eval-section">
                    <p className="eval-label">修正:</p>
                    <ul>
                      {evaluation.corrections.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="eval-section">
                  <p className="eval-label">模範解答:</p>
                  <p className="model-answer">{current.english}</p>
                </div>

                {evaluation.better_alternatives.length > 0 && (
                  <div className="eval-section">
                    <p className="eval-label">他の表現:</p>
                    <ul>
                      {evaluation.better_alternatives.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button className="btn-primary" onClick={nextQuestion}>
                  次の問題 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="drill-result">
          <h3>トレーニング完了!</h3>
          <p className="final-score">
            {score.correct} / {score.total} 正解
          </p>
          <p className="score-rate">
            正答率: {Math.round((score.correct / score.total) * 100)}%
          </p>
          <button className="btn-primary" onClick={() => setExercises([])}>
            もう一度チャレンジ
          </button>
        </div>
      )}
    </div>
  );
}
