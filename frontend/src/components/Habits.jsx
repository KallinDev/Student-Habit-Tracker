import React, { useContext, useEffect, useState } from "react";
import {
  Droplets,
  Book,
  Dumbbell,
  Brain,
  PenTool,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { ThemeContext } from "./reusables/ThemeContext.js";

// Map habit names to icons and colors for display
const habitIconMap = {
  "Drink water": { icon: Droplets, color: "text-blue-500" },
  "Read book": { icon: Book, color: "text-purple-500" },
  Exercise: { icon: Dumbbell, color: "text-red-500" },
  Meditate: { icon: Brain, color: "text-green-500" },
  Journal: { icon: PenTool, color: "text-orange-500" },
};

// Custom hook for modal animation (fade-in-up and fade-out-down)
function useModalAnimation(isOpen) {
  const [show, setShow] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? "modal-in" : "modal-out");

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimClass("modal-in"), 10); // trigger animation
    } else {
      setAnimClass("modal-out");
      const timeout = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  return [show, animClass, setAnimClass, setShow];
}

// Modal animation classes for Tailwind (add to your global CSS or Tailwind config)
if (
  typeof window !== "undefined" &&
  !document.getElementById("modal-anim-css")
) {
  const style = document.createElement("style");
  style.id = "modal-anim-css";
  style.innerHTML = `
    .modal-in {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
      transition: opacity 0.3s cubic-bezier(.4,0,.2,1), transform 0.3s cubic-bezier(.4,0,.2,1);
    }
    .modal-out {
      opacity: 0;
      transform: translateY(32px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(.4,0,.2,1), transform 0.3s cubic-bezier(.4,0,.2,1);
    }
  `;
  document.head.appendChild(style);
}

const HabitsContent = () => {
  const { isDarkMode, themeClasses } = useContext(ThemeContext);
  const [habits, setHabits] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    frequency: "daily",
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);

  // Animation helpers
  const [showEditModal, editAnimClass, setEditAnimClass] = useModalAnimation(
    !!editingHabit
  );
  const [showDeleteAnim, deleteAnimClass, setDeleteAnimClass] =
    useModalAnimation(showDeleteModal && habitToDelete);

  // Fetch habits
  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/user/habits");
      const data = await res.json();
      const habitsWithRates = (Array.isArray(data) ? data : []).map((h) => ({
        ...h,
        icon: habitIconMap[h.name]?.icon || Droplets,
        iconColor: habitIconMap[h.name]?.color || "text-blue-500",
        frequency: h.frequency || "Daily",
        currentStreak: h.currentStreak ?? h.current_streak ?? 0,
        bestStreak: h.bestStreak ?? h.best_streak ?? 0,
        successRate: h.successRate ?? 0,
        description: h.description || "",
      }));
      setHabits(habitsWithRates);
    } catch (error) {
      console.log(error);
      setHabits([]);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Handle edit button click
  const handleEditClick = (habit) => {
    setEditingHabit(habit);
    setEditForm({
      name: habit.name,
      description: habit.description || "",
      frequency: habit.frequency || "daily",
    });
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingHabit) return;
    try {
      await fetch(`/api/habits/${editingHabit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditingHabit(null);
      fetchHabits();
    } catch (error) {
      console.log(error);
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
      await fetch(`/api/habits/${habitToDelete.id}`, { method: "DELETE" });
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

  return (
    <div className={`min-h-screen ${themeClasses.mainBg} relative`}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text}`}>
            My Habits
          </h1>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {habits.map((habit) => (
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
                {habit.icon && (
                  <habit.icon size={24} className={habit.iconColor} />
                )}
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
          ))}
          <div
            className={`add-habit-box ${themeClasses.cardBg} rounded-xl shadow-sm border-2 border-dashed ${themeClasses.border} p-6 flex flex-col items-center justify-center min-h-[280px] cursor-pointer
              hover:brightness-110 active:brightness-120
              transition-all duration-150`}
            tabIndex={0}
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
        {showEditModal && (
          <div
            className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full flex justify-center ${editAnimClass}`}
            style={{ transitionProperty: "opacity, transform" }}
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
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Name
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
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditFormChange}
                    className={`w-full p-2 rounded border ${
                      isDarkMode
                        ? "bg-gray-900 text-white border-gray-700"
                        : "bg-white text-black border-gray-300"
                    }`}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className={`block mb-1 font-medium ${
                      isDarkMode ? "text-white" : "text-black"
                    }`}
                  >
                    Frequency
                  </label>
                  <select
                    name="frequency"
                    value={editForm.frequency}
                    onChange={handleEditFormChange}
                    className={`w-full p-2 rounded border ${
                      isDarkMode
                        ? "bg-gray-900 text-white border-gray-700"
                        : "bg-white text-black border-gray-300"
                    }`}
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
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
        {showDeleteAnim && (
          <div
            className={`fixed top-32 left-1/2 transform -translate-x-1/2 z-50 w-full flex justify-center ${deleteAnimClass}`}
            style={{ transitionProperty: "opacity, transform" }}
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
