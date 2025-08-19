import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const LoginForm = ({ onAuthSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBox, setShowBox] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowBox(true), 100);
    setTimeout(() => setShowCheck(true), 700);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Authentication failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      if (onAuthSuccess) onAuthSuccess(data);
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body, .font-sans { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
        .fade-in-box { opacity: 0; transform: translateY(40px) scale(0.98); transition: opacity 0.8s cubic-bezier(.4,0,.2,1), transform 0.8s cubic-bezier(.4,0,.2,1);}
        .fade-in-box.active { opacity: 1; transform: translateY(0) scale(1);}
        .pop-in-check { opacity: 0; transform: scale(0.5); transition: opacity 0.6s cubic-bezier(.4,0,.2,1), transform 0.6s cubic-bezier(.4,0,.2,1);}
        .pop-in-check.active { opacity: 1; transform: scale(1.08); animation: pop-check 0.6s cubic-bezier(.4,0,.2,1);}
        @keyframes pop-check { 0% { transform: scale(0.5);} 70% { transform: scale(1.15);} 100% { transform: scale(1.0);} }
      `}</style>

      <div
        className={`relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-800 border-opacity-30 fade-in-box ${
          showBox ? "active" : ""
        }`}
        style={{ minHeight: 480 }}
      >
        <div
          className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-indigo-600 rounded-full shadow-lg w-16 h-16 flex items-center justify-center border-4 border-indigo-400 pop-in-check ${
            showCheck ? "active" : ""
          }`}
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#6366f1" />
            <path
              d="M8 12l2 2 4-4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-100 mb-8 font-sans tracking-tight">
          Sign In
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              maxLength={80}
              pattern="^[^@]+@[^@]+\.[^@]+$"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
              maxLength={100}
            />
          </div>
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-8 text-center">
          <span className="text-gray-400">Don't have an account?</span>
          <button
            className="ml-2 text-indigo-400 font-semibold hover:underline transition"
            onClick={onSwitchToRegister}
            disabled={loading}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
