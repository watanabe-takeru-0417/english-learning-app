import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TranslationDrill from "./pages/TranslationDrill";
import VocabDrill from "./pages/VocabDrill";
import MockInterview from "./pages/MockInterview";
import "./styles/app.css";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <li>
      <Link to={to} className={isActive ? "active" : ""}>
        {children}
      </Link>
    </li>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <h1 className="logo">ENG+</h1>
          <ul className="nav-list">
            <NavLink to="/">Dashboard</NavLink>
            <NavLink to="/translation">瞬間英作文</NavLink>
            <NavLink to="/vocab">語彙ドリル</NavLink>
            <NavLink to="/interview">模擬面接</NavLink>
          </ul>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/translation" element={<TranslationDrill />} />
            <Route path="/vocab" element={<VocabDrill />} />
            <Route path="/interview" element={<MockInterview />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
