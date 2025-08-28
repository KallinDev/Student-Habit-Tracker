import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;

const RegisterForm = ({ onAuthSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lastName, setLastName] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC+01:00");
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
    if (password !== retypePassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password !== retypePassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${name} ${lastName}`.trim(),
          email,
          password,
          language,
          timezone,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      if (onAuthSuccess) onAuthSuccess(data);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full relative px-2 sm:px-0">
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
        className={`relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-4 sm:p-10 w-full max-w-md border border-gray-800 border-opacity-30 fade-in-box ${
          showBox ? "active" : ""
        }
        }`}
        style={{ minHeight: 400 }}
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
        <h2 className="text-3xl font-bold text-center text-gray-100 mb-8 font-sans tracking-tight mt-12">
          Create Account
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div className="flex flex-row gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
                First Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                className="w-full px-2 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="given-name"
                minLength={2}
                maxLength={40}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                className="w-full px-2 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                minLength={2}
                maxLength={40}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              Email
              <span className="text-red-500 ml-1">*</span>
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
          <div className="flex flex-row gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
                Password <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                className="w-full px-2 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                maxLength={100}
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
                Re-Enter Password <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                className="w-full px-2 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                maxLength={100}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              >
                <option value="English">English</option>
                <option value="Swedish">Swedish</option>
                {/* Add more languages as needed */}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              >
                <option value="UTC+01:00">
                  Central European Time - UTC+01:00
                </option>
                <option value="UTC+02:00">
                  Eastern European Time - UTC+02:00
                </option>
                <option value="UTC-05:00">
                  Eastern Time (US & Canada) - UTC-05:00
                </option>
                <option value="UTC-08:00">
                  Pacific Time (US & Canada) - UTC-08:00
                </option>
              </select>
            </div>
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
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <div className="mt-8 text-center">
          <span className="text-gray-400">Already have an account?</span>
          <button
            className="ml-2 text-indigo-400 font-semibold hover:underline transition"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
