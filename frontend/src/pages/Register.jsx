import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import "../styles/Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "", // CUSTOMER | RETAILER | WHOLESALER
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    document.body.classList.add("auth-no-offset");
    return () => document.body.classList.remove("auth-no-offset");
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    const payload = {
      username: (form.username || "").trim(),
      email: (form.email || "").trim(),
      password: form.password || "",
      role: (form.role || "").toUpperCase() || "CUSTOMER",
    };

    try {
      await api.post("/auth/register/", payload);
      navigate("/login", { replace: true });
    } catch (err) {
      const data = err?.response?.data || {};
      const perField = {};
      Object.keys(data).forEach((k) => {
        if (Array.isArray(data[k])) perField[k] = data[k].join(" ");
      });
      setFieldErrors(perField);

      const fallback =
        data?.detail ||
        data?.message ||
        "Registration failed. Please check the fields and try again.";
      setError(String(fallback));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fixed">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        <form className="auth-form side-labels" onSubmit={submit}>
          {/* Username */}
          <div className="auth-field side">
            <label htmlFor="username">Username</label>
            <div className="input-wrap">
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                required
              />
              {fieldErrors.username && (
                <small className="field-error">{fieldErrors.username}</small>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="auth-field side">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              {fieldErrors.email && (
                <small className="field-error">{fieldErrors.email}</small>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="auth-field side">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
              {fieldErrors.password && (
                <small className="field-error">{fieldErrors.password}</small>
              )}
            </div>
          </div>

          {/* Role */}
          <div className="auth-field side">
            <label htmlFor="role">Role</label>
            <div className="input-wrap">
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              >
                <option value="">Select role</option>
                <option value="CUSTOMER">Customer</option>
                <option value="RETAILER">Retailer</option>
                <option value="WHOLESALER">Wholesaler</option>
              </select>
              {fieldErrors.role && (
                <small className="field-error">{fieldErrors.role}</small>
              )}
            </div>
          </div>

          {/* Global Error */}
          {error && <div className="auth-error">{error}</div>}

          {/* Register Button */}
          <button className="auth-btn primary" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
