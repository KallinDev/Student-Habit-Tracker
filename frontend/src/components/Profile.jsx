import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "./reusables/ThemeContext.js";

const ProfileContent = () => {
  const { isDarkMode, themeClasses } = useContext(ThemeContext);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();

        setStats({
          activeHabits: data.activeHabits ?? data.active_habits ?? 0,
          totalDays: data.totalDays ?? data.total_days ?? 0,
          successRate:
            typeof data.successRate === "number"
              ? `${data.successRate}%`
              : typeof data.success_rate === "number"
              ? `${data.success_rate}%`
              : "0%",
          bestStreak: data.bestStreak ?? data.best_streak ?? 0,
        });
      } catch (error) {
        console.log(error);
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

  return (
    <div className={`flex h-screen ${themeClasses.mainBg}`}>
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
                <option
                  className={isDarkMode ? "bg-gray-800 text-white" : ""}
                  value="Europe/Stockholm"
                >
                  Stockholm - UTC+01:00
                </option>
                <option
                  className={isDarkMode ? "bg-gray-800 text-white" : ""}
                  value="Europe/London"
                >
                  London - UTC+00:00
                </option>
                <option
                  className={isDarkMode ? "bg-gray-800 text-white" : ""}
                  value="UTC+01:00"
                >
                  Central European Time - UTC+01:00
                </option>
                <option
                  className={isDarkMode ? "bg-gray-800 text-white" : ""}
                  value="UTC+02:00"
                >
                  Eastern European Time - UTC+02:00
                </option>
                <option
                  className={isDarkMode ? "bg-gray-800 text-white" : ""}
                  value="UTC-05:00"
                >
                  Eastern Time (US & Canada) - UTC-05:00
                </option>
                <option
                  className={isDarkMode ? "bg-gray-800 text-white" : ""}
                  value="UTC-08:00"
                >
                  Pacific Time (US & Canada) - UTC-08:00
                </option>
              </select>
            </div>
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
              className={`flex items-center justify-between py-2 border-b last:border-b-0 ${themeClasses.border}`}
            >
              <div>
                <p className={`${themeClasses.text}`}>{pref.label}</p>
                <p className={`text-sm ${themeClasses.textMuted}`}>
                  {pref.desc}
                </p>
              </div>
              <button
                onClick={() => pref.setState(!pref.state)}
                className={`w-10 h-6 rounded-full relative outline-none border-none focus:ring-2 focus:ring-indigo-400 transition-all duration-200 ${
                  pref.state
                    ? isDarkMode
                      ? "bg-indigo-600"
                      : "bg-indigo-500"
                    : isDarkMode
                    ? "bg-gray-700"
                    : "bg-gray-300"
                }`}
                tabIndex={0}
                aria-pressed={pref.state}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${
                    pref.state ? "translate-x-5" : "translate-x-1"
                  }`}
                  style={{
                    boxShadow: isDarkMode
                      ? "0 1px 4px rgba(0,0,0,0.3)"
                      : "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                ></div>
              </button>
            </div>
          ))}
        </div>

        {/* Danger Zone */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6 mb-6`}
        >
          <div className="flex justify-end gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg border ${themeClasses.border} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-indigo-400 active:scale-95 transition-all duration-200`}
              type="button"
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-400 active:scale-95 transition-all duration-200"
              type="button"
            >
              Save Changes
            </button>
          </div>
          <div className={`border-t ${themeClasses.border} my-4`}></div>
          <h3 className="text-red-500 font-semibold mb-2">Danger Zone</h3>
          <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
          <button
            className="px-4 py-2 rounded-lg border border-red-500 bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-400 active:scale-95 transition-all duration-200"
            type="button"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  return <ProfileContent />;
};

export default Profile;
