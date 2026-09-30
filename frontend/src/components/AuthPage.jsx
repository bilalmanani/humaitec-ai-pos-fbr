import { useState } from "react";

import "./AuthPage.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      mode === "signup" &&
      formData.password !== formData.confirm_password
    ) {
      setError("Passwords do not match.");
      return;
    }

    const endpoint =
      mode === "signup" ? "/auth/signup" : "/auth/login";

    const payload =
      mode === "signup"
        ? {
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Authentication request failed."
        );
      }

      if (mode === "signup") {
        setMessage(
          "Account created successfully. Please sign in."
        );

        setFormData({
          full_name: "",
          email: formData.email,
          password: "",
          confirm_password: "",
        });

        setMode("login");
        return;
      }

      localStorage.setItem(
        "customer_token",
        data.access_token
      );

      localStorage.setItem(
        "customer",
        JSON.stringify(data.customer)
      );

      onAuthenticated(data.customer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span>H</span>
          <div>
            <strong>HUMAITEC</strong>
            <small>POS & FBR SYSTEM</small>
          </div>
        </div>

        <h1>
          {mode === "login"
            ? "Welcome back"
            : "Create your account"}
        </h1>

        <p>
          {mode === "login"
            ? "Sign in to continue to HUMAITEC."
            : "Create an account to use HUMAITEC services."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={
              mode === "login" ? "active" : ""
            }
            onClick={() => switchMode("login")}
          >
            Sign In
          </button>

          <button
            type="button"
            className={
              mode === "signup" ? "active" : ""
            }
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <label>
              Full Name
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Example: Bilal Ahmad"
                minLength="2"
                required
              />
            </label>
          )}

          <label>
            Email Address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              minLength="8"
              required
            />
          </label>

          {mode === "signup" && (
            <label>
              Confirm Password
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Enter password again"
                minLength="8"
                required
              />
            </label>
          )}

          <button
            className="auth-submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="auth-success">{message}</p>
        )}

        {error && (
          <p className="auth-error">{error}</p>
        )}
      </section>
    </main>
  );
}

export default AuthPage;