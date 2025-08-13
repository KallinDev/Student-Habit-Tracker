import React, { useState, useEffect } from "react";
import { Settings, LogOut, User, BarChart3, Target, Info } from "lucide-react";

const Profile = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [firstName, setFirstName] = useState("Gustav");
  const [lastName, setLastName] = useState("Kallin");
  const [email, setEmail] = useState("gustav.kallin@live.se");
  const [timezone, setTimezone] = useState("Europe/Stockholm");
  const [language, setLanguage] = useState("English");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // Stats state (dynamic)
  const [stats, setStats] = useState({
    activeHabits: 0,
    totalDays: 0,
    successRate: "0%",
    bestStreak: 0,
  });

  // Fetch stats dynamically (replace with your real API endpoint)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats"); // Example endpoint
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();

        setStats({
          activeHabits: data.activeHabits,
          totalDays: data.totalDays,
          successRate: `${data.successRate}%`,
          bestStreak: data.bestStreak,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        // fallback mock data
        setStats({
          activeHabits: 0,
          totalDays: 0,
          successRate: "0%",
          bestStreak: 0,
        });
      }
    };

    fetchStats();
  }, []);

  const themeClasses = {
    mainBg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    sidebarBg: isDarkMode ? "bg-gray-800" : "bg-white",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
  };

  const sidebarItems = [
    { name: "Dashboard", icon: BarChart3, active: false },
    { name: "Profile", icon: User, active: true },
    { name: "My Habits", icon: Target, active: false },
    { name: "Progress", icon: BarChart3, active: false },
    { name: "About", icon: Info, active: false },
  ];

  return (
    <div className={`flex h-screen ${themeClasses.mainBg}`}>
      {/* Sidebar */}
      <div
        className={`w-64 ${themeClasses.sidebarBg} shadow-sm border-r ${themeClasses.border}`}
      >
        <div className="p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3">
              {firstName.charAt(0)}
            </div>
            <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
              Welcome, {firstName}
            </h2>
            <div
              className={`flex items-center gap-4 mt-2 text-sm ${themeClasses.textMuted}`}
            >
              <button
                className={`flex items-center gap-1 ${
                  isDarkMode ? "hover:text-gray-200" : "hover:text-gray-700"
                }`}
              >
                <Settings size={14} />
                Settings
              </button>
              <span>•</span>
              <button
                className={`flex items-center gap-1 ${
                  isDarkMode ? "hover:text-gray-200" : "hover:text-gray-700"
                }`}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                  item.active
                    ? `${
                        isDarkMode
                          ? "bg-indigo-900 text-indigo-300"
                          : "bg-indigo-50 text-indigo-700"
                      } border-l-4 border-indigo-700`
                    : `${themeClasses.textSecondary} ${themeClasses.hoverBg} ${
                        isDarkMode ? "hover:text-white" : "hover:text-gray-900"
                      }`
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Dark mode toggle */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-6 rounded-full relative transition-colors ${
              isDarkMode ? "bg-indigo-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                isDarkMode ? "translate-x-5" : "translate-x-1"
              }`}
            ></div>
          </button>
          <span className={`text-sm ${themeClasses.textSecondary}`}>
            {isDarkMode ? "Dark" : "Light"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>
          Profile
        </h1>

        {/* Profile Header */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6 mb-6`}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
              {firstName.charAt(0)}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                {firstName} {lastName}
              </h2>
              <p className={`text-sm ${themeClasses.textMuted}`}>{email}</p>
              <p className={`text-xs ${themeClasses.textMuted}`}>
                Member since June 2025
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: "ACTIVE HABITS", value: stats.activeHabits },
              { label: "TOTAL DAYS", value: stats.totalDays },
              { label: "SUCCESS RATE", value: stats.successRate },
              { label: "BEST STREAK", value: stats.bestStreak },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className={`text-xl font-bold ${themeClasses.text}`}>
                  {stat.value}
                </p>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Information */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6 mb-6`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label
                className={`block mb-1 text-sm font-medium ${themeClasses.text}`}
              >
                First Name
              </label>
              <input
                type="text"
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${themeClasses.border} bg-transparent ${themeClasses.text}`}
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                className={`block mb-1 text-sm font-medium ${themeClasses.text}`}
              >
                Last Name
              </label>
              <input
                type="text"
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${themeClasses.border} bg-transparent ${themeClasses.text}`}
              />
            </div>

            {/* Email Address */}
            <div>
              <label
                className={`block mb-1 text-sm font-medium ${themeClasses.text}`}
              >
                Email Address
              </label>
              <input
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${themeClasses.border} bg-transparent ${themeClasses.text}`}
              />
            </div>

            {/* Timezone */}
            <div>
              <label
                className={`block mb-1 text-sm font-medium ${themeClasses.text}`}
              >
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${themeClasses.border} bg-transparent ${themeClasses.text}`}
              >
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  GMT
                </option>
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  GMT+1
                </option>
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  GMT+2
                </option>
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  EST
                </option>
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  PST
                </option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label
                className={`block mb-1 text-sm font-medium ${themeClasses.text}`}
              >
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${themeClasses.border} bg-transparent ${themeClasses.text}`}
              >
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  English
                </option>
                <option className={isDarkMode ? "bg-gray-800 text-white" : ""}>
                  Swedish
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6 mb-6`}
        >
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
            Preferences
          </h3>
          {[
            {
              label: "Email Notifications",
              desc: "Receive daily reminders and progress updates",
              state: emailNotifications,
              setState: setEmailNotifications,
            },
            {
              label: "Push Notifications",
              desc: "Get notified about habit reminders",
              state: pushNotifications,
              setState: setPushNotifications,
            },
            {
              label: "Weekly Reports",
              desc: "Receive weekly habit progress summaries",
              state: weeklyReports,
              setState: setWeeklyReports,
            },
          ].map((pref, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div>
                <p className={`${themeClasses.text}`}>{pref.label}</p>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  {pref.desc}
                </p>
              </div>
              <button
                onClick={() => pref.setState(!pref.state)}
                className={`w-10 h-6 rounded-full relative transition-colors ${
                  pref.state ? "bg-indigo-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                    pref.state ? "translate-x-5" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6 mb-6`}
        >
          {/* Cancel / Save Changes buttons - top right */}
          <div className="flex justify-end gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.textSecondary}`}
            >
              Cancel
            </button>
            <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
              Save Changes
            </button>
          </div>

          {/* Danger Zone content */}
          <h3 className="text-red-500 font-semibold mb-2">Danger Zone</h3>
          <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
