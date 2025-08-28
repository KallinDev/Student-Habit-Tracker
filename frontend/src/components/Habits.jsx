import React, { useContext, useEffect, useState, useRef } from "react";
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
import { useNavigate } from "react-router-dom";
import Sidebar from "./reusables/Sidebar.jsx";

// Change this to your backend port if needed
const API_BASE = "http://localhost:3000";

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

const habitColorMap = {
  "Drink water": "text-blue-500",
  "Read book": "text-purple-500",
  Exercise: "text-red-500",
  Meditate: "text-green-500",
  Journal: "text-orange-500",
};

const iconOptions = [
  { icon: "Droplets", label: "Water" },
  { icon: "Coffee", label: "Coffee" },
  { icon: "Book", label: "Book" },
  { icon: "Dumbbell", label: "Exercise" },
  { icon: "Brain", label: "Meditate" },
  { icon: "PenTool", label: "Journal" },
  { icon: "Bed", label: "Sleep" },
  { icon: "Leaf", label: "Nature" },
  { icon: "Calculator", label: "Math" },
  { icon: "Music", label: "Music" },
  { icon: "Apple", label: "Fruit" },
];

const colorOptions = [
  { name: "Blue", className: "text-blue-500", hex: "#3b82f6" },
  { name: "Purple", className: "text-purple-500", hex: "#a78bfa" },
  { name: "Red", className: "text-red-500", hex: "#ef4444" },
  { name: "Green", className: "text-green-500", hex: "#22c55e" },
  { name: "Orange", className: "text-orange-500", hex: "#f97316" },
  { name: "Yellow", className: "text-yellow-500", hex: "#eab308" },
  { name: "Pink", className: "text-pink-500", hex: "#ec4899" },
  { name: "Gray", className: "text-gray-500", hex: "#6b7280" },
];

const unitOptions = [
  "glasses",
  "cups",
  "pages",
  "minutes",
  "times",
  "sessions",
  "entries",
  "chapters",
  "steps",
];

// Modal animation CSS
const modalAnimationStyles = `
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes fadeOutDown {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
}
.modal-in {
  opacity: 1;
  transform: translateY(0) scale(1);
  animation: fadeInUp 0.35s cubic-bezier(.4,0,.2,1) both;
}
.modal-out {
  opacity: 0;
  transform: translateY(40px) scale(0.98);
  animation: fadeOutDown 0.3s cubic-bezier(.4,0,.2,1) both;
}
`;

const HabitsContent = () => {
  // Sidebar toggle state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDarkMode, themeClasses } = useContext(ThemeContext);
  const [habits, setHabits] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    icon: "Droplets",
    iconColor: colorOptions[0].className,
    frequency: "daily",
    dailyGoal: "",
    unit: unitOptions[0],
    description: "",
    reminderEnabled: false,
    reminderTime: "09:00",
  });

  // Inject animation styles once
  const styleRef = useRef(null);
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement("style");
      style.innerHTML = modalAnimationStyles;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);

  // Animation hooks with show value exposed
  function useModalAnimation(isOpen) {
    const [show, setShow] = useState(isOpen);
    const [animClass, setAnimClass] = useState(
      isOpen ? "modal-in" : "modal-out"
    );
    useEffect(() => {
      if (isOpen) {
        setShow(true);
        setAnimClass("modal-in"); // Set immediately, no timeout
      } else if (show) {
        setAnimClass("modal-out");
        const timeout = setTimeout(() => setShow(false), 300);
        return () => clearTimeout(timeout);
      }
    }, [isOpen, show]);
    return [show, animClass, setAnimClass, setShow];
  }

  // Use show value for rendering modals
  const [showEdit, editAnimClass, setEditAnimClass] = useModalAnimation(
    !!editingHabit
  );
  const [showDelete, deleteAnimClass, setDeleteAnimClass] = useModalAnimation(
    showDeleteModal && habitToDelete
  );

  const navigate = useNavigate();

  // Fetch habits for logged-in user
  const fetchHabits = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(`${API_BASE}/api/user/habits`, {
        headers: { "user-id": userId },
      });
      const data = await res.json();
      const habitsWithRates = (Array.isArray(data) ? data : []).map((h) => ({
        ...h,
        icon: h.icon || getLegacyIconName(h.name),
        color: iconMap[h.icon] ? "" : habitColorMap[h.name] || "text-blue-500",
        iconColor: h.iconColor || h.icon_color || "",
        frequency: h.frequency || "Daily",
        currentStreak: h.currentStreak ?? h.current_streak ?? 0,
        bestStreak: h.bestStreak ?? h.best_streak ?? 0,
        successRate: h.successRate ?? 0,
        description: h.description || "",
        dailyGoal: h.dailyGoal ?? h.daily_goal ?? "",
        unit: h.unit || unitOptions[0],
        reminderEnabled: h.reminderEnabled ?? h.reminder_enabled ?? false,
        reminderTime: h.reminderTime ?? h.reminder_time ?? "09:00",
      }));
      setHabits(habitsWithRates);
    } catch (error) {
      console.log(error);
      setHabits([]);
    }
  };

  function getLegacyIconName(name) {
    if (name === "Drink water") return "Droplets";
    if (name === "Read book") return "Book";
    if (name === "Exercise") return "Dumbbell";
    if (name === "Meditate") return "Brain";
    if (name === "Journal") return "PenTool";
    return "Droplets";
  }

  useEffect(() => {
    fetchHabits();
    const handleFocus = () => fetchHabits();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Handle edit button click
  const handleEditClick = (habit) => {
    setEditingHabit(habit);
    setEditForm({
      name: habit.name,
      icon: habit.icon || "Droplets",
      iconColor:
        habit.iconColor || habit.icon_color || colorOptions[0].className,
      frequency: habit.frequency || "daily",
      dailyGoal: habit.dailyGoal ?? habit.daily_goal ?? "",
      unit: habit.unit || unitOptions[0],
      description: habit.description || "",
      reminderEnabled: habit.reminderEnabled ?? habit.reminder_enabled ?? false,
      reminderTime: habit.reminderTime ?? habit.reminder_time ?? "09:00",
    });
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Icon/color/unit handlers
  const handleEditIconSelect = (iconName) => {
    setEditForm((prev) => ({
      ...prev,
      icon: iconName,
    }));
  };
  const handleEditColorSelect = (colorClass) => {
    setEditForm((prev) => ({ ...prev, iconColor: colorClass }));
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingHabit) return;
    try {
      const userId = localStorage.getItem("userId");
      const payload = {
        name: editForm.name,
        icon: editForm.icon,
        iconColor: editForm.iconColor,
        frequency: editForm.frequency,
        dailyGoal: Number(editForm.dailyGoal),
        unit: editForm.unit,
        description: editForm.description,
        reminder_enabled: editForm.reminderEnabled,
        reminder_time: editForm.reminderTime,
      };
      const res = await fetch(`${API_BASE}/api/habits/${editingHabit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        alert(`Failed to update habit: ${errorText}`);
      }

      setEditingHabit(null);
      fetchHabits();
    } catch (error) {
      alert("Failed to update habit: " + error.message);
    }
  };

  // Show delete modal
  const handleDeleteClick = (habit) => {
    setHabitToDelete(habit);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!habitToDelete) return;
    try {
      const userId = localStorage.getItem("userId");
      await fetch(`${API_BASE}/api/habits/${habitToDelete.id}`, {
        method: "DELETE",
        headers: { "user-id": userId },
      });
      setShowDeleteModal(false);
      setHabitToDelete(null);
      fetchHabits();
    } catch (error) {
      console.log(error);
    }
  };

  // Cancel delete with animation
  const cancelDelete = () => {
    setDeleteAnimClass("modal-out");
    setTimeout(() => {
      setShowDeleteModal(false);
      setHabitToDelete(null);
    }, 300);
  };

  // Cancel edit with animation
  const cancelEdit = () => {
    setEditAnimClass("modal-out");
    setTimeout(() => {
      setEditingHabit(null);
    }, 300);
  };

  const handleAddHabit = () => {
    navigate("/add-habit");
  };

  return (
    <div className={`min-h-screen ${themeClasses.mainBg} relative`}>
      {/* Sidebar with slide-in for mobile only */}
      <div
        className={`fixed top-0 left-0 flex h-full z-40 shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "16rem", willChange: "transform" }}
      >
        <Sidebar />
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
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <h1
            className={`text-3xl font-bold ${themeClasses.text} mt-12 sm:mt-0`}
          >
            My Habits
          </h1>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {habits.map((habit) => {
            const IconComponent = iconMap[habit.icon] || Droplets;
            const iconColorClass =
              habit.iconColor && habit.iconColor !== ""
                ? habit.iconColor
                : habit.color && habit.color !== ""
                ? habit.color
                : isDarkMode
                ? "text-gray-300"
                : "text-gray-500";
            return (
              <div
                key={habit.id || habit.name}
                className={`${themeClasses.cardBg} rounded-xl shadow-sm border ${themeClasses.border} p-6 relative`}
              >
                {/* Edit and Delete buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    className={`p-1.5 rounded-lg btn-base transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                    }`}
                    onClick={() => handleEditClick(habit)}
                    aria-label="Edit"
                    type="button"
                  >
                    <Edit2
                      size={16}
                      className={`transition-colors duration-150 ${
                        isDarkMode ? "text-gray-300" : "text-gray-500"
                      }`}
                    />
                  </button>
                  <button
                    className={`p-1.5 rounded-lg btn-base transition-all duration-200 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-red-700 active:bg-red-600"
                        : "bg-red-50 hover:bg-red-100 active:bg-red-200"
                    }`}
                    onClick={() => handleDeleteClick(habit)}
                    aria-label="Delete"
                    type="button"
                  >
                    <Trash2
                      size={16}
                      className={`transition-colors duration-150 ${
                        isDarkMode ? "text-red-300" : "text-red-500"
                      }`}
                    />
                  </button>
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-full ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  } flex items-center justify-center mb-4`}
                >
                  <IconComponent size={24} className={iconColorClass} />
                </div>

                {/* Habit name */}
                <h3 className={`text-lg font-medium ${themeClasses.text} mb-1`}>
                  {habit.name}
                </h3>
                {/* Habit description */}
                {habit.description && (
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    {habit.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {habit.currentStreak}
                    </div>
                    <div
                      className={`text-xs ${themeClasses.textMuted} uppercase tracking-wide`}
                    >
                      Current Streak
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {habit.bestStreak}
                    </div>
                    <div
                      className={`text-xs ${themeClasses.textMuted} uppercase tracking-wide`}
                    >
                      Best Streak
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${themeClasses.text}`}>
                      {habit.successRate}%
                    </div>
                    <div
                      className={`text-xs ${themeClasses.textMuted} uppercase tracking-wide`}
                    >
                      Success Rate
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                  {habit.frequency}
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full h-2 rounded-full ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${habit.successRate}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div
            className={`add-habit-box ${themeClasses.cardBg} rounded-xl shadow-sm border-2 border-dashed ${themeClasses.border} p-6 flex flex-col items-center justify-center min-h-[280px] cursor-pointer
              hover:brightness-110 active:brightness-120
              transition-all duration-150`}
            tabIndex={0}
            onClick={handleAddHabit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleAddHabit();
            }}
            role="button"
            aria-label="Add New Habit"
          >
            <Plus
              size={48}
              className={`${themeClasses.textMuted} mb-4 transition-colors duration-150`}
            />
            <span
              className={`text-lg ${themeClasses.textMuted} transition-colors duration-150`}
            >
              Add New Habit
            </span>
          </div>
        </div>

        {/* Edit Modal */}
        {showEdit && (
          <div
            className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full flex justify-center ${editAnimClass}`}
            style={{
              transitionProperty: "opacity, transform",
              willChange: "opacity, transform",
            }}
          >
            {editingHabit && (
              <form
                className={`rounded-xl p-8 shadow-lg w-full max-w-2xl border ${
                  isDarkMode
                    ? "bg-gray-800 border-indigo-500"
                    : "bg-white border-indigo-500"
                }`}
                onSubmit={handleEditSubmit}
              >
                <h2
                  className={`text-xl font-bold mb-4 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Edit Habit
                </h2>
                {/* Habit Name */}
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Habit Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className={`w-full p-2 rounded border ${
                      isDarkMode
                        ? "bg-gray-900 text-white border-gray-700"
                        : "bg-white text-black border-gray-300"
                    }`}
                    required
                  />
                </div>
                {/* Choose Icon */}
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Choose Icon
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {iconOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-150 ${
                          editForm.icon === opt.icon
                            ? "border-indigo-500 bg-indigo-500"
                            : isDarkMode
                            ? "border-gray-700 bg-gray-800 hover:bg-gray-700 active:bg-gray-900"
                            : "border-gray-300 bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                        }`}
                        onClick={() => handleEditIconSelect(opt.icon)}
                        aria-label={opt.label}
                        style={{
                          boxShadow:
                            editForm.icon === opt.icon
                              ? "0 0 0 2px rgba(99,102,241,0.3)"
                              : "none",
                        }}
                      >
                        {React.createElement(iconMap[opt.icon], {
                          size: 24,
                          className:
                            editForm.icon === opt.icon
                              ? "text-white"
                              : isDarkMode
                              ? "text-gray-300"
                              : "text-gray-500",
                        })}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Choose Color */}
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Icon Color
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                          editForm.iconColor === color.className
                            ? "border-indigo-500"
                            : "border-gray-300"
                        }`}
                        style={{
                          backgroundColor: color.hex,
                          boxShadow:
                            editForm.iconColor === color.className
                              ? "0 0 0 2px rgba(99,102,241,0.3)"
                              : "none",
                        }}
                        onClick={() => handleEditColorSelect(color.className)}
                        aria-label={color.name}
                      >
                        {editForm.iconColor === color.className && (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Frequency */}
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Frequency
                  </label>
                  <div className="flex gap-2">
                    {["daily", "weekly", "custom"].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-150 ${
                          editForm.frequency === freq
                            ? "bg-indigo-500 text-white"
                            : isDarkMode
                            ? "bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-900"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                        }`}
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, frequency: freq }))
                        }
                        style={{
                          boxShadow:
                            editForm.frequency === freq
                              ? "0 0 0 2px rgba(99,102,241,0.3)"
                              : "none",
                        }}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Daily Goal & Unit */}
                <div className="mb-4 flex gap-2">
                  <div className="flex-1">
                    <label
                      className={`block mb-1 font-medium ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      Daily Goal
                    </label>
                    <input
                      type="number"
                      name="dailyGoal"
                      value={editForm.dailyGoal}
                      onChange={handleEditFormChange}
                      min={1}
                      className={`w-full p-2 rounded border ${
                        isDarkMode
                          ? "bg-gray-900 text-white border-gray-700"
                          : "bg-white text-black border-gray-300"
                      }`}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      className={`block mb-1 font-medium ${
                        isDarkMode ? "text-white" : "text-black"
                      }`}
                    >
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={editForm.unit}
                      onChange={handleEditFormChange}
                      className={`w-full p-2 rounded border ${
                        isDarkMode
                          ? "bg-gray-900 text-white border-gray-700"
                          : "bg-white text-black border-gray-300"
                      }`}
                    >
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Description */}
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    rows={2}
                    className={`w-full p-2 rounded border ${
                      isDarkMode
                        ? "bg-gray-900 text-white border-gray-700 placeholder:text-gray-400"
                        : "bg-white text-black border-gray-300 placeholder:text-gray-600"
                    }`}
                    placeholder="Add any notes or motivation for this habit..."
                  />
                </div>
                {/* Buttons */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded btn-base transition-all duration-300 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-black"
                    }`}
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded btn-base transition-all duration-200 ${
                      isDarkMode
                        ? "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white"
                        : "bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white"
                    }`}
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Delete Modal */}
        {showDelete && (
          <div
            className={`fixed top-32 left-1/2 transform -translate-x-1/2 z-50 w-full flex justify-center ${deleteAnimClass}`}
            style={{
              transitionProperty: "opacity, transform",
              willChange: "opacity, transform",
            }}
          >
            {showDeleteModal && habitToDelete && (
              <div
                className={`rounded-xl p-8 shadow-lg w-full max-w-xl border ${
                  isDarkMode
                    ? "bg-gray-800 border-red-600"
                    : "bg-white border-red-400"
                }`}
              >
                <h2
                  className={`text-xl font-bold mb-4 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Warning
                </h2>
                <p
                  className={`mb-6 ${isDarkMode ? "text-white" : "text-black"}`}
                >
                  Are you sure you want to delete{" "}
                  <span className="font-bold">{habitToDelete.name}</span>? This
                  action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded btn-base transition-all duration-300 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
                        : "bg-red-100 hover:bg-red-50 active:bg-red-200 text-black"
                    }`}
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded btn-base transition-all duration-300 ${
                      isDarkMode
                        ? "bg-red-700 hover:bg-red-600 active:bg-red-500 text-white"
                        : "bg-red-600 hover:bg-red-500 active:bg-red-400 text-white"
                    }`}
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Habits = () => {
  return <HabitsContent />;
};

export default Habits;
