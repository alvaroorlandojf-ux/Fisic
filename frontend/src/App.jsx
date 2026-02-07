import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { clearToken, getToken } from "./api";

function Header() {
  const isLoggedIn = Boolean(getToken());

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">Probio</Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Página pública</Link>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <button
                type="button"
                className="nav-button"
                onClick={() => {
                  clearToken();
                  window.location.href = "/login";
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Entrar</Link>
              <Link to="/register" className="nav-link button">Criar conta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<PublicProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/:username" element={<PublicProfile />} />
        </Routes>
      </main>
    </div>
  );
}
