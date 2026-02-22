import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h2>English Learning Dashboard</h2>
      <p className="subtitle">外資企業で活躍するための英語力を鍛えよう</p>

      <div className="card-grid">
        <Link to="/translation" className="feature-card">
          <span className="card-icon">⚡</span>
          <h3>瞬間英作文</h3>
          <p>日本語を見て瞬時に英語に変換するトレーニング。一番効果的な練習法。</p>
          <span className="card-action">Start Training →</span>
        </Link>

        <Link to="/vocab" className="feature-card">
          <span className="card-icon">📖</span>
          <h3>語彙ドリル</h3>
          <p>ビジネス・テック頻出単語のフラッシュカード。覚えるまで繰り返し。</p>
          <span className="card-action">Start Drilling →</span>
        </Link>

        <Link to="/interview" className="feature-card">
          <span className="card-icon">🎤</span>
          <h3>模擬面接</h3>
          <p>外資テック企業の面接をシミュレーション。AIがフィードバック。</p>
          <span className="card-action">Start Interview →</span>
        </Link>
      </div>

      <div className="info-section">
        <h3>Multi-Agent Architecture</h3>
        <p>このアプリは MCP (Model Context Protocol) を使って複数のAIエージェントが連携しています：</p>
        <ul>
          <li><strong>Gemini</strong> — コンテンツ生成・リサーチ</li>
          <li><strong>Grok</strong> — リアルタイム情報・検証</li>
          <li><strong>OpenAI</strong> — コード生成・実装</li>
          <li><strong>Claude</strong> — 設計・オーケストレーション</li>
        </ul>
      </div>
    </div>
  );
}
