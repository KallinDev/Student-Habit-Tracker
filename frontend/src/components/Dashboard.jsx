import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Droplets,
  Book,
  Dumbbell,
  Brain,
  PenTool,
  Coffee,
  Bed,
  Leaf,
  Calculator,
  Music,
  Apple,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { ThemeContext } from "./reusables/ThemeContext.js";

const API_BASE = "http://localhost:3000";
const USER_ID = "default_user"; // Always use this for all requests

const iconMap = {
  Droplets,
  Coffee,
  Book,
  Dumbbell,
  Brain,
  PenTool,
  Bed,
  Leaf,
  Calculator,
  Music,
  Apple,
};

const DashboardContent = () => {
  const { isDarkMode, themeClasses } = useContext(ThemeContext);

  const [focusLevel, setFocusLevel] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [habits, setHabits] = useState([]);
  const [habitHistory, setHabitHistory] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);

  // For slider drag: only save on release
  const sliderDragging = useRef(false);

  // Fetch habits and completions
  const fetchHabitsAndCompletions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/habits`, {
        headers: { "user-id": USER_ID },
      });
      if (!res.ok) throw new Error("Failed to fetch habits");
      const data = await res.json();
      const habitsArray = Array.isArray(data) ? data : data.data;

      // Fetch today's completions
      const todayString = getTodayDateString();
      const completionsRes = await fetch(
        `${API_BASE}/api/user/habits/completions?date=${todayString}`,
        { headers: { "user-id": USER_ID } }
      );
      const completionsData = completionsRes.ok
        ? await completionsRes.json()
        : [];
      const completedMap = {};
      completionsData.forEach((c) => {
        completedMap[c.habitId] = c.completed;
      });

      setHabits(
        Array.isArray(habitsArray)
          ? habitsArray.map((h) => ({
              ...h,
              icon: iconMap[h.icon] || Droplets,
              completed: !!completedMap[h.id],
            }))
          : []
      );

      // Fetch habit history for calendar (last 21 days)
      await fetchHabitHistory();
    } catch (err) {
      console.warn("Habits endpoint missing or failed:", err);
      setHabits([]);
    }

    // Try to fetch streaks, but don't crash if not found
    try {
      const statsRes = await fetch(`${API_BASE}/api/user/stats`, {
        headers: { "user-id": USER_ID },
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setCurrentStreak(stats.currentStreak || 0);
        setLongestStreak(stats.bestStreak || 0);
      } else {
        setCurrentStreak(0);
        setLongestStreak(0);
      }
    } catch (err) {
      console.warn("Stats endpoint missing or failed:", err);
      setCurrentStreak(0);
      setLongestStreak(0);
    }
  };

  // Fetch habit history for the calendar
  const fetchHabitHistory = async () => {
    try {
      const history = {};

      // Generate last 21 days
      for (let i = 20; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        // Fetch completions for this date
        const completionsRes = await fetch(
          `${API_BASE}/api/user/habits/completions?date=${dateString}`,
          { headers: { "user-id": USER_ID } }
        );

        if (completionsRes.ok) {
          const completions = await completionsRes.json();
          const allCompleted =
            completions.length > 0 && completions.every((c) => c.completed);
          if (allCompleted) {
            history[dateString] = "completed";
          }
        }
      }

      setHabitHistory(history);
    } catch (err) {
      console.warn("Failed to fetch habit history:", err);
    }
  };

  // Fetch today's mood/focus
  const fetchTodayMood = async () => {
    try {
      setMoodLoading(true);
      const todayString = getTodayDateString();
      const res = await fetch(`${API_BASE}/api/user/mood?date=${todayString}`, {
        headers: { "user-id": USER_ID },
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFocusLevel(data.focus_level ?? 0);
          setSelectedMood(data.mood ?? null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch today's mood:", err);
    } finally {
      setMoodLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitsAndCompletions();
    fetchTodayMood();
    // eslint-disable-next-line
  }, []);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- Toggle habit: mark or unmark as completed for today ---
  const toggleHabit = async (habitId) => {
    if (loading) return;

    setLoading(true);
    const todayString = getTodayDateString();
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) {
      setLoading(false);
      return;
    }

    const endpoint = habit.completed
      ? `${API_BASE}/api/habits/${habitId}/uncomplete`
      : `${API_BASE}/api/habits/${habitId}/complete`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": USER_ID,
        },
        body: JSON.stringify({ date: todayString }),
      });

      if (!res.ok) {
        console.error("Toggle endpoint failed:", res.status, await res.text());
        setLoading(false);
        return;
      }

      await fetchHabitsAndCompletions();
    } catch (err) {
      console.error("Toggle endpoint failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Save mood/focus for today ---
  const saveMoodFocus = async (mood, focus) => {
    setMoodLoading(true);
    const todayString = getTodayDateString();
    try {
      await fetch(`${API_BASE}/api/user/mood`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": USER_ID,
        },
        body: JSON.stringify({
          mood,
          focusLevel: focus,
          date: todayString,
        }),
      });
      setSelectedMood(mood);
      setFocusLevel(focus);
    } catch (err) {
      console.error("Failed to save mood/focus:", err);
    } finally {
      setMoodLoading(false);
    }
  };

  // --- Handlers for mood/focus ---
  const handleFocusChange = (e) => {
    setFocusLevel(Number(e.target.value));
    sliderDragging.current = true;
  };

  const handleFocusSave = () => {
    if (sliderDragging.current) {
      saveMoodFocus(selectedMood, focusLevel);
      sliderDragging.current = false;
    }
  };

  const handleFocusBlur = () => {
    // For keyboard users
    saveMoodFocus(selectedMood, focusLevel);
    sliderDragging.current = false;
  };

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    await saveMoodFocus(mood, focusLevel);
  };

  // --- Motivational message based on mood/focus ---
  const getMotivationMessage = () => {
    if (selectedMood === "happy" && focusLevel >= 7) {
      return "You're on fire today! Keep up the great work! 🚀";
    }
    if (selectedMood === "happy") {
      return "Glad you're feeling good! Try to focus on your top priorities.";
    }
    if (selectedMood === "neutral") {
      return focusLevel >= 7
        ? "Strong focus! Even on a neutral day, you can achieve a lot."
        : "Take it easy and do what you can. Every step counts!";
    }
    if (selectedMood === "sad") {
      return focusLevel >= 7
        ? "Impressive focus despite feeling down. Be proud of yourself!"
        : "It's okay to have tough days. Be kind to yourself and take small steps.";
    }
    return "";
  };

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

  const iconBg = isDarkMode ? "bg-indigo-900" : "bg-indigo-50";

  return (
    <div className={`flex h-screen ${themeClasses.mainBg}`}>
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
                  {habits.map((habit) => {
                    const IconComponent = habit.icon || Droplets;
                    return (
                      <div
                        key={habit.id}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer
                          transition-all duration-200
                          ${
                            isDarkMode
                              ? "hover:bg-gray-700 active:bg-gray-800"
                              : "hover:bg-gray-50 active:bg-gray-100"
                          }
                          ${loading ? "opacity-50 pointer-events-none" : ""}
                          focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                        onClick={() => toggleHabit(habit.id)}
                        tabIndex={0}
                      >
                        <div
                          className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center transition-all duration-200`}
                        >
                          {React.createElement(IconComponent, {
                            size: 18,
                            className: isDarkMode
                              ? "text-white"
                              : "text-indigo-600",
                          })}
                        </div>
                        <span className={`flex-1 ${themeClasses.text}`}>
                          {habit.name}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
                            ${
                              habit.completed
                                ? "bg-green-500"
                                : isDarkMode
                                ? "bg-gray-600"
                                : "bg-gray-200"
                            }
                            ${habit.completed ? "shadow-md" : ""}`}
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
                    );
                  })}
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

            {/* How do you feel today (mood options above focus level) */}
            <div
              className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
                How do you feel today?
              </h2>
              {/* Mood options */}
              <div className="flex gap-3 justify-center mb-6">
                <button
                  onClick={() => handleMoodSelect("sad")}
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
                  disabled={moodLoading}
                >
                  <span className="text-4xl">😢</span>
                </button>
                <button
                  onClick={() => handleMoodSelect("neutral")}
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
                  disabled={moodLoading}
                >
                  <span className="text-4xl">😐</span>
                </button>
                <button
                  onClick={() => handleMoodSelect("happy")}
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
                  disabled={moodLoading}
                >
                  <span className="text-4xl">😊</span>
                </button>
              </div>
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
                    onChange={handleFocusChange}
                    onMouseUp={handleFocusSave}
                    onTouchEnd={handleFocusSave}
                    onBlur={handleFocusBlur}
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
                    disabled={moodLoading}
                  />
                </div>
              </div>
            </div>

            {/* Motivational Quotes */}
            <div className={`${themeClasses.cardBg} rounded-2xl shadow-sm p-6`}>
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
                Motivational Quote
              </h2>
              {selectedMood || focusLevel ? (
                <div
                  className={`mt-2 p-4 rounded-xl text-center font-medium ${themeClasses.text} text-2xl`}
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', 'serif'",
                    fontStyle: "italic",
                  }}
                >
                  <span className="text-4xl leading-none align-top">“</span>
                  {getMotivationMessage()}
                  <span className="text-4xl leading-none align-bottom">”</span>
                </div>
              ) : (
                <div
                  className={`mt-2 p-4 rounded-xl text-center font-medium ${themeClasses.text} text-2xl`}
                  style={{
                    fontFamily: "'Georgia', 'Times New Roman', 'serif'",
                    fontStyle: "italic",
                  }}
                >
                  <span className="text-4xl leading-none align-top">“</span>
                  Set your mood and focus level to get a motivational quote!
                  <span className="text-4xl leading-none align-bottom">”</span>
                </div>
              )}
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
                {weekdays.map((day, idx) => (
                  <div
                    key={`${day}-${idx}`}
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

      <style>{`
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

const Dashboard = () => {
  return <DashboardContent />;
};

export default Dashboard;
