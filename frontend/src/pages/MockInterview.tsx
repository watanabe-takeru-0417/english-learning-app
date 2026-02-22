import { useState } from "react";
import { api, InterviewQuestion, InterviewFeedback } from "../api/backend";

const TOPICS = [
  { id: "self-introduction", label: "自己紹介" },
  { id: "technical-skills", label: "技術スキル" },
  { id: "project-experience", label: "プロジェクト経験" },
  { id: "career-goals", label: "キャリア目標" },
  { id: "behavioral", label: "行動面接" },
];

export default function MockInterview() {
  const [topic, setTopic] = useState("self-introduction");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [allFeedback, setAllFeedback] = useState<InterviewFeedback[]>([]);
  const [loading, setLoading] = useState(false);

  const startInterview = async () => {
    setLoading(true);
    try {
      const data = await api.getInterviewQuestions(topic, 5);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAllFeedback([]);
      setFeedback(null);
      setUserAnswer("");
    } catch {
      alert("面接問題の取得に失敗しました。バックエンドが起動しているか確認してください。");
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    try {
      const result = await api.evaluateInterview(
        questions[currentIndex].question,
        userAnswer
      );
      setFeedback(result);
      setAllFeedback((prev) => [...prev, result]);
    } catch {
      alert("評価に失敗しました。");
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    setCurrentIndex((prev) => prev + 1);
    setUserAnswer("");
    setFeedback(null);
  };

  const current = questions[currentIndex];
  const isFinished = questions.length > 0 && currentIndex >= questions.length;
  const avgScore =
    allFeedback.length > 0
      ? Math.round(
          allFeedback.reduce((sum, f) => sum + f.score, 0) / allFeedback.length
        )
      : 0;

  return (
    <div className="drill-page">
      <h2>🎤 模擬面接</h2>

      {questions.length === 0 && (
        <div className="drill-setup">
          <div className="option-group">
            <label>トピック</label>
            <div className="button-group">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  className={topic === t.id ? "active" : ""}
                  onClick={() => setTopic(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={startInterview} disabled={loading}>
            {loading ? "準備中..." : "面接を開始"}
          </button>
        </div>
      )}

      {current && !isFinished && (
        <div className="drill-active">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
          <span className="progress-text">
            Question {currentIndex + 1} / {questions.length}
          </span>

          <div className="question-card interview-card">
            <p className="interviewer-label">Interviewer:</p>
            <p className="interview-question">{current.question}</p>
            <p className="question-ja">{current.japanese}</p>

            {!feedback && (
              <>
                <textarea
                  className="answer-input large"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Answer in English..."
                  rows={6}
                />
                <button
                  className="btn-primary"
                  onClick={submitAnswer}
                  disabled={loading || !userAnswer.trim()}
                >
                  {loading ? "評価中..." : "Submit Answer"}
                </button>
              </>
            )}

            {feedback && (
              <div className="evaluation">
                <p className="eval-score">Score: {feedback.score}/10</p>

                <div className="eval-section">
                  <p className="eval-label">良かった点:</p>
                  <ul>
                    {feedback.good_points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="eval-section">
                  <p className="eval-label">改善点:</p>
                  <ul>
                    {feedback.improvements.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="eval-section">
                  <p className="eval-label">模範解答:</p>
                  <p className="model-answer">{feedback.corrected_answer}</p>
                </div>

                <div className="eval-section">
                  <p className="eval-label">フィードバック:</p>
                  <p>{feedback.feedback_ja}</p>
                </div>

                <button className="btn-primary" onClick={nextQuestion}>
                  Next Question →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isFinished && (
        <div className="drill-result">
          <h3>面接終了!</h3>
          <p className="final-score">平均スコア: {avgScore}/10</p>

          <div className="feedback-summary">
            {allFeedback.map((f, i) => (
              <div key={i} className="feedback-item">
                <p>
                  Q{i + 1}: {questions[i].question}
                </p>
                <p>Score: {f.score}/10</p>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setQuestions([])}>
            もう一度挑戦
          </button>
        </div>
      )}
    </div>
  );
}
