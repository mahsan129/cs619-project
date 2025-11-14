

// frontend/src/pages/Login.jsx
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Auth.css"; // scoped styles only for this page


export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ⬇️ Remove global navbar padding on auth pages
useEffect(() => {
    document.body.classList.add("auth-no-offset");
    return () => document.body.classList.remove("auth-no-offset");
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const me = await login(form.username, form.password); // 👈 yahan se role mil raha
      if (me.role === "ADMIN") {
        navigate("/admin", { replace: true });   // ✅ admin -> new admin design
      } else {
        navigate("/dashboard", { replace: true }); // baqi sab -> normal dashboard
      }
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page fixed">
      <div className="auth-card">
        <h2 className="auth-title">Member Login</h2>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

       <div className="auth-switch">
          Don't have an account? <Link to="/Register">Register</Link>
        </div>
        
      </div>
    </div>
  );
}
