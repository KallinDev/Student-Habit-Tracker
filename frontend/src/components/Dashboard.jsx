import React, { useState } from "react";
import {
  Settings,
  LogOut,
  User,
  BarChart3,
  Target,
  Info,
  Droplets,
  Book,
  Dumbbell,
  Brain,
  PenTool,
} from "lucide-react";

const Dashboard = () => {
  const [focusLevel, setFocusLevel] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [habitHistory, setHabitHistory] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [habits, setHabits] = useState([
    { id: 1, name: "Drink water", icon: Droplets, completed: false },
    { id: 2, name: "Read book", icon: Book, completed: false },
    { id: 3, name: "Exercise", icon: Dumbbell, completed: false },
    { id: 4, name: "Meditate", icon: Brain, completed: false },
    { id: 5, name: "Journal", icon: PenTool, completed: false },
  ]);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toggleHabit = (habitId) => {
    setHabits((prevHabits) => {
      const updatedHabits = prevHabits.map((habit) =>
        habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
      );

      const allCompleted = updatedHabits.every((habit) => habit.completed);
      const wasAllCompleted = prevHabits.every((habit) => habit.completed);
      const todayString = getTodayDateString();

      if (allCompleted && !wasAllCompleted) {
        const newStreak = currentStreak + 1;
        setCurrentStreak(newStreak);

        if (newStreak > longestStreak) {
          setLongestStreak(newStreak);
        }

        setHabitHistory((prev) => ({
          ...prev,
          [todayString]: "completed",
        }));
      } else if (!allCompleted && wasAllCompleted) {
        setCurrentStreak(0);

        setHabitHistory((prev) => {
          const newHistory = { ...prev };
          delete newHistory[todayString];
          return newHistory;
        });
      }

      return updatedHabits;
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const sidebarItems = [
    { name: "Dashboard", icon: BarChart3, active: true },
    { name: "Profile", icon: User, active: false },
    { name: "My Habits", icon: Target, active: false },
    { name: "Progress", icon: BarChart3, active: false },
    { name: "About", icon: Info, active: false },
  ];

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  const generateCalendarData = () => {
    const days = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 20);

    for (let i = 0; i < 21; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayOfWeek = date.getDay();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const status =
        habitHistory[dateString] === "completed" ? "completed" : "empty";

      days.push({ date, status, dayOfWeek, dateString });
    }

    return days;
  };

  const calendarData = generateCalendarData();

  const getCalendarColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      default:
        return isDarkMode ? "bg-gray-700" : "bg-gray-200";
    }
  };

  const themeClasses = {
    mainBg: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    sidebarBg: isDarkMode ? "bg-gray-800" : "bg-white",
    cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
    text: isDarkMode ? "text-white" : "text-gray-900",
    textSecondary: isDarkMode ? "text-gray-300" : "text-gray-600",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    hoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
    habitItemHoverBg: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
    iconBg: isDarkMode ? "bg-indigo-900" : "bg-indigo-50",
  };

  return (
    <div className={`flex h-screen ${themeClasses.mainBg}`}>
      {/* Sidebar */}
      <div
        className={`w-64 ${themeClasses.sidebarBg} shadow-sm border-r ${themeClasses.border}`}
      >
        <div className="p-6">
          {/* User Profile */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3">
              G
            </div>
            <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
              Welcome, Gustav
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
            onClick={toggleDarkMode}
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
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>
            Dashboard
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Habits */}
            <div className="lg:col-span-2">
              <div
                className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
              >
                <h2
                  className={`text-xl font-semibold ${themeClasses.text} mb-6`}
                >
                  Today's Habits
                </h2>
                <div className="space-y-4">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${themeClasses.habitItemHoverBg} cursor-pointer`}
                      onClick={() => toggleHabit(habit.id)}
                    >
                      <div
                        className={`w-10 h-10 ${themeClasses.iconBg} rounded-full flex items-center justify-center`}
                      >
                        <habit.icon
                          size={18}
                          className={
                            isDarkMode ? "text-white" : "text-indigo-600"
                          }
                        />
                      </div>
                      <span className={`flex-1 ${themeClasses.text}`}>
                        {habit.name}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          habit.completed
                            ? "bg-green-500"
                            : isDarkMode
                            ? "bg-gray-600"
                            : "bg-gray-200"
                        }`}
                      >
                        {habit.completed && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Streaks */}
            <div
              className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
                Streaks
              </h2>
              <div className="space-y-4">
                <div>
                  <div className={`text-sm ${themeClasses.textMuted} mb-1`}>
                    Current Streak
                  </div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {currentStreak} Days
                  </div>
                </div>
                <div>
                  <div className={`text-sm ${themeClasses.textMuted} mb-1`}>
                    Longest Streak
                  </div>
                  <div className="text-3xl font-bold text-indigo-400">
                    {longestStreak} Days
                  </div>
                </div>
              </div>
            </div>

            {/* How do you feel today */}
            <div
              className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
                How do you feel today?
              </h2>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${themeClasses.textSecondary}`}>
                    Focus level:
                  </span>
                  <span className={`text-sm font-medium ${themeClasses.text}`}>
                    {focusLevel}/10
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={focusLevel}
                    onChange={(e) => setFocusLevel(e.target.value)}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-200"
                    }`}
                    style={{
                      background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${
                        focusLevel * 10
                      }%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${
                        focusLevel * 10
                      }%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Set Mood */}
            <div
              className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
                Set Mood
              </h2>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSelectedMood("sad")}
                  className={`w-20 h-20 rounded-full border-3 transition-colors ${
                    selectedMood === "sad"
                      ? `border-indigo-500 ${
                          isDarkMode ? "bg-indigo-900" : "bg-indigo-50"
                        }`
                      : `${themeClasses.border} ${
                          isDarkMode
                            ? "hover:border-gray-500"
                            : "hover:border-gray-300"
                        }`
                  }`}
                >
                  <span className="text-4xl">😢</span>
                </button>
                <button
                  onClick={() => setSelectedMood("neutral")}
                  className={`w-20 h-20 rounded-full border-3 transition-colors ${
                    selectedMood === "neutral"
                      ? `border-indigo-500 ${
                          isDarkMode ? "bg-indigo-900" : "bg-indigo-50"
                        }`
                      : `${themeClasses.border} ${
                          isDarkMode
                            ? "hover:border-gray-500"
                            : "hover:border-gray-300"
                        }`
                  }`}
                >
                  <span className="text-4xl">😐</span>
                </button>
                <button
                  onClick={() => setSelectedMood("happy")}
                  className={`w-20 h-20 rounded-full border-3 transition-colors ${
                    selectedMood === "happy"
                      ? `border-indigo-500 ${
                          isDarkMode ? "bg-indigo-900" : "bg-indigo-50"
                        }`
                      : `${themeClasses.border} ${
                          isDarkMode
                            ? "hover:border-gray-500"
                            : "hover:border-gray-300"
                        }`
                  }`}
                >
                  <span className="text-4xl">😊</span>
                </button>
              </div>
            </div>

            {/* Habit History */}
            <div
              className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
                Habit History
              </h2>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className={`text-xs ${themeClasses.textMuted} text-center font-medium py-1 flex items-center justify-center`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from(
                  { length: calendarData[0]?.dayOfWeek || 0 },
                  (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="w-8 h-8 flex items-center justify-center"
                    ></div>
                  )
                )}

                {calendarData.map((day) => (
                  <div
                    key={day.dateString}
                    className={`w-8 h-8 rounded ${getCalendarColor(
                      day.status
                    )} hover:opacity-80 cursor-pointer flex items-center justify-center mx-auto`}
                    title={`${day.date.toLocaleDateString()}: ${
                      day.status === "completed"
                        ? "All habits completed!"
                        : "No completion"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
