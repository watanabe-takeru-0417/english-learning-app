import { useState } from "react";
import { api, VocabWord } from "../api/backend";

const VOCAB_CATEGORIES = [
  { id: "business", label: "ビジネス" },
  { id: "tech", label: "テック" },
  { id: "interview", label: "面接" },
  { id: "daily", label: "日常" },
];

export default function VocabDrill() {
  const [category, setCategory] = useState("business");
  const [words, setWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const startDrill = async () => {
    setLoading(true);
    try {
      const data = await api.getVocabulary(category, 20);
      setWords(data.words);
      setCurrentIndex(0);
      setKnown(new Set());
      setFlipped(false);
    } catch {
      alert("語彙の取得に失敗しました。バックエンドが起動しているか確認してください。");
    }
    setLoading(false);
  };

  const markKnown = () => {
    setKnown((prev) => new Set([...prev, currentIndex]));
    next();
  };

  const next = () => {
    setFlipped(false);
    // Skip known words
    let nextIdx = currentIndex + 1;
    while (nextIdx < words.length && known.has(nextIdx)) {
      nextIdx++;
    }
    setCurrentIndex(nextIdx);
  };

  const remaining = words.filter((_, i) => !known.has(i));
  const current = words[currentIndex];
  const isFinished = words.length > 0 && (currentIndex >= words.length || remaining.length === 0);

  return (
    <div className="drill-page">
      <h2>📖 語彙ドリル</h2>

      {words.length === 0 && (
        <div className="drill-setup">
          <div className="option-group">
            <label>カテゴリ</label>
            <div className="button-group">
              {VOCAB_CATEGORIES.map((c) => (
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
              style={{ width: `${(known.size / words.length) * 100}%` }}
            />
          </div>
          <span className="progress-text">
            覚えた: {known.size} / {words.length}
          </span>

          <div
            className={`flashcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped(!flipped)}
          >
            {!flipped ? (
              <div className="card-front">
                <p className="vocab-japanese">{current.japanese}</p>
                <p className="tap-hint">タップしてめくる</p>
              </div>
            ) : (
              <div className="card-back">
                <p className="vocab-word">{current.word}</p>
                <p className="vocab-pronunciation">{current.pronunciation}</p>
                <p className="vocab-example">{current.example}</p>
              </div>
            )}
          </div>

          {flipped && (
            <div className="action-row">
              <button className="btn-unknown" onClick={next}>
                まだ覚えてない
              </button>
              <button className="btn-known" onClick={markKnown}>
                覚えた!
              </button>
            </div>
          )}
        </div>
      )}

      {isFinished && (
        <div className="drill-result">
          <h3>完了!</h3>
          <p className="final-score">{known.size} / {words.length} 語を習得</p>
          <button className="btn-primary" onClick={() => setWords([])}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}
