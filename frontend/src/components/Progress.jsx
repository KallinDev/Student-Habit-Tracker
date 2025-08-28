import React, { useContext, useEffect, useState } from "react";
import Sidebar from "./reusables/Sidebar.jsx";
import { ThemeContext } from "./reusables/ThemeContext.js";
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
} from "lucide-react";

// Simple line chart component (no external library)
const LineChart = ({ data, color = "#6366f1" }) => {
  if (!data || data.length === 0)
    return <div className="text-xs text-gray-400">No data</div>;
  const width = 260;
  const height = 60;
  const maxY = Math.max(...data.map((d) => d.value), 100);
  const minY = Math.min(...data.map((d) => d.value), 0);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 20) + 10;
    const y =
      height - ((d.value - minY) / (maxY - minY || 1)) * (height - 20) - 10;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points.join(" ")}
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * (width - 20) + 10;
        const y =
          height - ((d.value - minY) / (maxY - minY || 1)) * (height - 20) - 10;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
};

// Simple pie chart component (no external library)
const PieChart = ({ data, colors }) => {
  if (!data || data.length === 0)
    return <div className="text-xs text-gray-400">No data</div>;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-xs text-gray-400">No data</div>;
  let cumulative = 0;
  const radius = 40;
  const cx = 50;
  const cy = 50;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      {data.map((slice, i) => {
        const startAngle = (cumulative / total) * 2 * Math.PI;
        const endAngle = ((cumulative + slice.value) / total) * 2 * Math.PI;
        cumulative += slice.value;
        const x1 = cx + radius * Math.sin(startAngle);
        const y1 = cy - radius * Math.cos(startAngle);
        const x2 = cx + radius * Math.sin(endAngle);
        const y2 = cy - radius * Math.cos(endAngle);
        const largeArc = slice.value / total > 0.5 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill={colors[i % colors.length]}
            stroke="#fff"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
};

const iconMap = {
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
  "Drink water": Droplets,
  "Read book": Book,
  Exercise: Dumbbell,
  Meditate: Brain,
  Journal: PenTool,
};

const PERIODS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
];

const PIE_COLORS = [
  "#6366f1",
  "#34d399",
  "#f59e42",
  "#f472b6",
  "#60a5fa",
  "#fbbf24",
  "#a3e635",
  "#f87171",
  "#38bdf8",
  "#c084fc",
];

const ProgressContent = () => {
  const { isDarkMode, themeClasses } = useContext(ThemeContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    successRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    habitsCompleted: 0,
    bestHabit: null,
  });
  const [habits, setHabits] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[1].value); // Default 30 days
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    // Fetch stats
    fetch("https://student-habit-tracker.onrender.com/api/user/stats", {
      headers: { "user-id": userId },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats((prev) => ({
          ...prev,
          successRate: data.successRate || 0,
          currentStreak: data.currentStreak || 0,
          bestStreak: data.bestStreak || 0,
        }));
      });

    // Fetch habits
    fetch("https://student-habit-tracker.onrender.com/api/user/habits", {
      headers: { "user-id": userId },
    })
      .then((res) => res.json())
      .then((data) => {
        const habitsArray = Array.isArray(data) ? data : data.data;
        setHabits(habitsArray);

        // Calculate habits completed (last 30 days)
        let habitsCompleted = 0;
        let bestHabit = null;
        let bestRate = 0;
        habitsArray.forEach((habit) => {
          habitsCompleted += habit.total_completions || 0;
          if (habit.successRate > bestRate) {
            bestRate = habit.successRate;
            bestHabit = habit;
          }
        });
        setStats((prev) => ({
          ...prev,
          habitsCompleted,
          bestHabit,
        }));

        // Pie chart data: successRate per habit
        setPieData(
          habitsArray.map((habit) => ({
            label: habit.name,
            value: habit.successRate || 0,
            icon: habit.icon,
          }))
        );
      });
  }, []);

  // Fetch chart data when selectedPeriod changes
  useEffect(() => {
    setLoadingChart(true);
    const userId = localStorage.getItem("userId");
    fetch(
      `https://student-habit-tracker.onrender.com/api/user/stats/trend?days=${selectedPeriod}`,
      {
        headers: { "user-id": userId },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        // data: [{ date: "YYYY-MM-DD", successRate: number }]
        setChartData(
          Array.isArray(data)
            ? data.map((d) => ({
                label: d.date.slice(5), // MM-DD
                value: d.successRate,
              }))
            : []
        );
      })
      .finally(() => setLoadingChart(false));
  }, [selectedPeriod]);

  return (
    <div className={`flex min-h-screen ${themeClasses.mainBg} relative`}>
      {/* Sidebar for mobile only, slide-in, fills vertical space */}
      <div
        className={`fixed top-0 left-0 flex h-full z-40 shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "16rem", willChange: "transform" }}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar toggle button (mobile only) */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-indigo-600 text-white shadow-lg lg:hidden"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <h1
            className={`text-3xl font-bold mb-6 ${themeClasses.text} mt-12 lg:mt-0`}
          >
            Progress
          </h1>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div
              className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border}`}
            >
              <div className={`text-2xl font-bold text-indigo-500 mb-1`}>
                {stats.successRate}%
              </div>
              <div className={`text-sm ${themeClasses.textMuted}`}>
                Overall Success Rate
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                Last 30 days
              </div>
            </div>
            <div
              className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border}`}
            >
              <div className={`text-2xl font-bold text-indigo-500 mb-1`}>
                {stats.currentStreak}
              </div>
              <div className={`text-sm ${themeClasses.textMuted}`}>
                Current Streak
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                Days in a row
              </div>
            </div>
            <div
              className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border}`}
            >
              <div className={`text-2xl font-bold text-indigo-500 mb-1`}>
                {stats.habitsCompleted}
              </div>
              <div className={`text-sm ${themeClasses.textMuted}`}>
                Habits Completed
              </div>
              <div className={`text-xs ${themeClasses.textSecondary}`}>
                This month
              </div>
            </div>
            <div
              className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border} flex items-center gap-2`}
            >
              {stats.bestHabit ? (
                <>
                  {React.createElement(
                    iconMap[stats.bestHabit.icon] ||
                      iconMap[stats.bestHabit.name] ||
                      Droplets,
                    {
                      size: 28,
                      className: "text-blue-400",
                    }
                  )}
                  <div>
                    <div className={`text-sm ${themeClasses.textMuted}`}>
                      Best Performing
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      {stats.bestHabit.name} ({stats.bestHabit.successRate}%)
                    </div>
                  </div>
                </>
              ) : (
                <div className={`text-sm ${themeClasses.textMuted}`}>
                  Best Performing
                </div>
              )}
            </div>
          </div>

          {/* Analytics */}
          <div className="mb-8">
            <h2 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
              Analytics
            </h2>
            <div className="flex gap-2 mb-4">
              {PERIODS.map((period) => (
                <button
                  key={period.value}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-150 ${
                    selectedPeriod === period.value
                      ? "bg-indigo-500 text-white"
                      : isDarkMode
                      ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedPeriod(period.value)}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border} flex flex-col items-center justify-center min-h-[180px]`}
              >
                <div
                  className={`text-base font-semibold mb-2 ${themeClasses.text}`}
                >
                  Success Rate Over Time
                </div>
                <div className={`text-sm ${themeClasses.textMuted}`}>
                  {loadingChart
                    ? "Loading..."
                    : "Line Chart - Success Rate Trends"}
                </div>
                <div className="w-full flex items-center justify-center mt-2">
                  <LineChart data={chartData} color="#6366f1" />
                </div>
                <div className="flex justify-between w-full mt-2 text-xs text-gray-400">
                  {chartData.length > 0 && (
                    <>
                      <span>{chartData[0].label}</span>
                      <span>{chartData[chartData.length - 1].label}</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border} flex flex-col items-center justify-center min-h-[180px]`}
              >
                <div
                  className={`text-base font-semibold mb-2 ${themeClasses.text}`}
                >
                  Habit Distribution
                </div>
                <div className={`text-sm ${themeClasses.textMuted}`}>
                  Pie Chart - Habit Completion
                </div>
                <div className="w-full flex items-center justify-center mt-2">
                  <PieChart data={pieData} colors={PIE_COLORS} />
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {pieData.map((slice, i) => {
                    const IconComponent =
                      iconMap[slice.icon] || iconMap[slice.label] || Droplets;
                    return (
                      <div
                        key={slice.label}
                        className="flex items-center gap-1 text-xs"
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{
                            background: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        ></span>
                        <IconComponent
                          size={14}
                          className="inline-block text-gray-400 mr-1"
                        />
                        <span className={themeClasses.text}>{slice.label}</span>
                        <span className="text-gray-400 ml-1">
                          {slice.value}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Individual Habits Progress */}
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
              Individual Habits Progress
            </h2>
            <div
              className={`rounded-xl shadow-sm p-6 ${themeClasses.cardBg} border ${themeClasses.border}`}
            >
              {habits.map((habit) => {
                // Try icon by habit.icon, then habit.name, fallback to Droplets
                const IconComponent =
                  iconMap[habit.icon] || iconMap[habit.name] || Droplets;
                const percent = habit.successRate || 0;
                return (
                  <div
                    key={habit.id || habit.name}
                    className="flex items-center gap-4 mb-6 last:mb-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <IconComponent size={22} className="text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${themeClasses.text}`}>
                        {habit.name}
                      </div>
                      <div className={`text-xs ${themeClasses.textMuted}`}>
                        {habit.total_completions || 0} of 30 days • Best streak:{" "}
                        {habit.best_streak || 0} days
                      </div>
                    </div>
                    <div className="w-24 flex flex-col items-end">
                      <div className="w-full h-2 rounded-full bg-gray-200 mb-1">
                        <div
                          className="h-2 rounded-full bg-green-400 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div
                        className={`text-xs font-semibold ${themeClasses.text}`}
                      >
                        {percent}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Progress = () => {
  return <ProgressContent />;
};

export default Progress;
