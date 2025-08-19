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
function getUserId() {
  return localStorage.getItem("userId");
}

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
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const { isDarkMode, themeClasses } = useContext(ThemeContext);

  const [focusLevel, setFocusLevel] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [habitHistory, setHabitHistory] = useState({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);
  const [accountCreatedAt, setAccountCreatedAt] = useState(null);

  // For slider drag: only save on release
  const sliderDragging = useRef(false);

  // --- State for selected day in calendar ---
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedDayHabits, setSelectedDayHabits] = useState([]);

  // --- Fetch streaks from backend ---
  const fetchStreaks = async () => {
    try {
      const statsRes = await fetch(`${API_BASE}/api/user/stats`, {
        headers: { "user-id": getUserId() },
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setCurrentStreak(stats.currentStreak || 0);
        setLongestStreak(stats.bestStreak || 0);
      }
    } catch (err) {
      console.error("Failed to fetch streaks:", err);
      setCurrentStreak(0);
      setLongestStreak(0);
    }
  };

  // Fetch habits for a specific date
  const fetchHabitsForDate = async (dateString) => {
    const habitsRes = await fetch(`${API_BASE}/api/user/habits`, {
      headers: { "user-id": getUserId() },
    });
    const habitsArray = habitsRes.ok ? await habitsRes.json() : [];
    const completionsRes = await fetch(
      `${API_BASE}/api/user/habits/completions?date=${dateString}`,
      { headers: { "user-id": getUserId() } }
    );
    const completions = completionsRes.ok ? await completionsRes.json() : [];
    const completedMap = {};
    completions.forEach((c) => {
      completedMap[c.habitId] = c.completed;
    });
    setSelectedDayHabits(
      habitsArray
        .filter((h) => h.created_at.slice(0, 10) <= dateString)
        .map((h) => ({
          ...h,
          icon: iconMap[h.icon] || Droplets,
          completed: !!completedMap[h.id],
        }))
    );
  };

  // --- Fetch habit history for the calendar ---
  const fetchHabitHistory = async () => {
    if (!accountCreatedAt) {
      setHabitHistory({});
      return;
    }
    try {
      const history = {};

      // Get all habits once
      const habitsRes = await fetch(`${API_BASE}/api/user/habits`, {
        headers: { "user-id": getUserId() },
      });
      const habitsArray = habitsRes.ok ? await habitsRes.json() : [];

      // Generate last 21 days
      for (let i = 20; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        // Days before account creation: always grey
        if (dateString < accountCreatedAt) {
          history[dateString] = "empty";
          continue;
        }

        // Habits active on this day
        const habitsForDay = habitsArray.filter(
          (h) => h.created_at.slice(0, 10) <= dateString
        );
        const habitIdsForDay = habitsForDay.map((h) => h.id);
        const totalCount = habitIdsForDay.length;

        // Fetch completions for this date
        const completionsRes = await fetch(
          `${API_BASE}/api/user/habits/completions?date=${dateString}`,
          { headers: { "user-id": getUserId() } }
        );
        const completions = completionsRes.ok
          ? await completionsRes.json()
          : [];

        // Only count completions for habits that exist on this day
        const completedCount = completions.filter(
          (c) => c.completed && habitIdsForDay.includes(c.habitId)
        ).length;

        if (totalCount === 0) {
          history[dateString] = "empty";
        } else if (completedCount === totalCount) {
          history[dateString] = "completed";
        } else if (completedCount > 0) {
          history[dateString] = "partial";
        } else {
          history[dateString] = "empty";
        }
      }

      setHabitHistory(history);
      await fetchStreaks(); // FIX: update streaks after history
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
        headers: { "user-id": getUserId() },
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

  // Fetch account creation date
  const fetchAccountCreatedAt = async () => {
    const profileRes = await fetch(`${API_BASE}/api/user/profile`, {
      headers: { "user-id": getUserId() },
    });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      setAccountCreatedAt(profile.memberSince?.slice(0, 10) || null);
    } else {
      setAccountCreatedAt(null);
    }
  };

  useEffect(() => {
    fetchAccountCreatedAt();
    fetchTodayMood();
    fetchHabitsForDate(getTodayDateString());
    fetchStreaks(); // FIX: fetch streaks on load
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (accountCreatedAt) {
      fetchHabitHistory();
      fetchHabitsForDate(selectedDate);
    }
    // eslint-disable-next-line
  }, [accountCreatedAt]);

  useEffect(() => {
    if (selectedDate) {
      fetchHabitsForDate(selectedDate);
    }
    // eslint-disable-next-line
  }, [selectedDate]);

  // --- Toggle habit for selected day ---
  const toggleHabitForDate = async (habitId, dateString, completed) => {
    const endpoint = completed
      ? `${API_BASE}/api/habits/${habitId}/uncomplete`
      : `${API_BASE}/api/habits/${habitId}/complete`;
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": getUserId(),
      },
      body: JSON.stringify({ date: dateString }),
    });
    await fetchHabitsForDate(dateString);
    await fetchHabitHistory();
    await fetchStreaks(); // FIX: update streaks after toggling
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
          "user-id": getUserId(),
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

      const status = habitHistory[dateString] || "empty";

      days.push({ date, status, dayOfWeek, dateString });
    }

    return days;
  };

  const calendarData = generateCalendarData();

  const getCalendarColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-400";
      default:
        return isDarkMode ? "bg-gray-700" : "bg-gray-200";
    }
  };

  const iconBg = isDarkMode ? "bg-indigo-900" : "bg-indigo-50";

  // Helper to get month label for the calendar (English, capitalized)
  const getMonthLabel = () => {
    if (calendarData.length === 0) return "";
    const first = calendarData[0].date;
    const last = calendarData[calendarData.length - 1].date;
    const firstMonth = first.toLocaleString("en-US", { month: "long" });
    const lastMonth = last.toLocaleString("en-US", { month: "long" });
    const year = last.getFullYear();
    return firstMonth === lastMonth
      ? `${capitalize(firstMonth)} ${year}`
      : `${capitalize(firstMonth)} – ${capitalize(lastMonth)} ${year}`;
  };

  // Capitalize helper
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <div className={`flex h-screen ${themeClasses.mainBg}`}>
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>
            Dashboard
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Habits for selected day */}
            <div className="lg:col-span-2">
              <div
                className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
              >
                <h2
                  className={`text-xl font-semibold ${themeClasses.text} mb-2`}
                >
                  Habits for{" "}
                  <span className="text-indigo-500 font-bold">
                    {selectedDate === getTodayDateString()
                      ? "Today"
                      : selectedDate}
                  </span>
                </h2>
                <div className="space-y-4">
                  {selectedDayHabits.map((habit) => {
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
                        onClick={() =>
                          toggleHabitForDate(
                            habit.id,
                            selectedDate,
                            habit.completed
                          )
                        }
                        tabIndex={0}
                      >
                        <div
                          className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center`}
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
                          className={`w-6 h-6 rounded-full flex items-center justify-center
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
                  className={`mt-2 p-4 rounded-xl text-center font-medium ${themeClasses.text} text-3xl`}
                  style={{
                    fontFamily:
                      "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                    fontStyle: "italic",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span className="text-5xl leading-none align-top">“</span>
                  {getMotivationMessage()}
                  <span className="text-5xl leading-none align-bottom">”</span>
                </div>
              ) : (
                <div
                  className={`mt-2 p-4 rounded-xl text-center font-medium ${themeClasses.text} text-3xl`}
                  style={{
                    fontFamily:
                      "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                    fontStyle: "italic",
                    letterSpacing: "0.01em",
                  }}
                >
                  <span className="text-5xl leading-none align-top">“</span>
                  Set your mood and focus level to get a motivational quote!
                  <span className="text-5xl leading-none align-bottom">”</span>
                </div>
              )}
            </div>

            {/* Habit History */}
            <div
              className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6`}
            >
              <h2 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
                Habit History
              </h2>
              <div
                className={`mb-4 text-center font-medium ${themeClasses.text}`}
              >
                {getMonthLabel()}
              </div>
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
                {/* Pad empty cells for first week */}
                {calendarData.length > 0 &&
                  Array.from({ length: calendarData[0].dayOfWeek }, (_, i) => (
                    <div
                      key={`pad-${i}`}
                      className="w-8 h-8 flex items-center justify-center"
                    ></div>
                  ))}

                {calendarData.map((day) => {
                  const isToday = day.dateString === getTodayDateString();
                  return (
                    <div
                      key={day.dateString}
                      className={`w-8 h-8 rounded flex items-center justify-center mx-auto
          ${getCalendarColor(day.status)}
          hover:opacity-80 cursor-pointer
          ${isToday ? "ring-2 ring-indigo-400" : ""}
        `}
                      title={`${day.date.toLocaleDateString()}: ${
                        day.status === "completed"
                          ? "All habits completed!"
                          : day.status === "partial"
                          ? "Some habits completed"
                          : "No habits completed"
                      }`}
                      onClick={() => {
                        setSelectedDate(day.dateString);
                        fetchHabitsForDate(day.dateString);
                        fetchStreaks(); // FIX: update streaks on calendar click
                      }}
                      style={{
                        border:
                          selectedDate === day.dateString
                            ? "2px solid #6366f1"
                            : "none",
                      }}
                    >
                      <span
                        className={`text-xs font-semibold ${
                          isDarkMode ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap');
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
