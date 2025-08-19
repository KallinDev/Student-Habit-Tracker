import React, { useState, useContext } from "react";
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
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "./reusables/ThemeContext.js";

const iconOptions = [
  { icon: Droplets, label: "Water", name: "Droplets" },
  { icon: Coffee, label: "Coffee", name: "Coffee" },
  { icon: Book, label: "Book", name: "Book" },
  { icon: Dumbbell, label: "Exercise", name: "Dumbbell" },
  { icon: Brain, label: "Meditate", name: "Brain" },
  { icon: PenTool, label: "Journal", name: "PenTool" },
  { icon: Bed, label: "Sleep", name: "Bed" },
  { icon: Leaf, label: "Nature", name: "Leaf" },
  { icon: Calculator, label: "Math", name: "Calculator" },
  { icon: Music, label: "Music", name: "Music" },
  { icon: Apple, label: "Fruit", name: "Apple" },
];

// Color options for icons
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

const API_BASE = "http://localhost:3000";
function getUserId() {
  return localStorage.getItem("userId");
}

const AddHabits = ({ onCreated }) => {
  const { isDarkMode, themeClasses } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    icon: Droplets,
    iconColor: colorOptions[0].className,
    frequency: "daily",
    dailyGoal: "",
    unit: "glasses",
    description: "",
    reminderEnabled: false,
    reminderTime: "09:00",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleIconSelect = (icon) => {
    setForm((prev) => ({ ...prev, icon }));
  };

  const handleColorSelect = (colorClass) => {
    setForm((prev) => ({ ...prev, iconColor: colorClass }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Find the icon name for the API
      const selectedIconOption = iconOptions.find(
        (opt) => opt.icon === form.icon
      );
      const iconName = selectedIconOption
        ? selectedIconOption.name
        : "Droplets";

      const res = await fetch(`${API_BASE}/api/habits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": getUserId(),
        },
        body: JSON.stringify({
          name: form.name,
          icon: iconName,
          iconColor: form.iconColor,
          frequency: form.frequency,
          dailyGoal: Number(form.dailyGoal),
          unit: form.unit,
          description: form.description,
          reminder_enabled: form.reminderEnabled,
          reminder_time: form.reminderTime,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setSubmitting(false);

      // Instantly update MyHabits (call onCreated if provided)
      if (onCreated) onCreated();

      // Go to Habits.jsx (assumed route: "/habits")
      navigate("/habits");
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert("Failed to create habit.");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? themeClasses.mainBg : "bg-gray-100"
      }`}
    >
      <div
        className={`rounded-2xl shadow-lg w-full max-w-xl p-8 border ${
          isDarkMode
            ? "bg-gray-800 border-indigo-500 text-white"
            : "bg-white border-indigo-500 text-black"
        }`}
      >
        <h2
          className={`text-2xl font-bold mb-6 text-center ${
            isDarkMode ? "text-indigo-200" : "text-indigo-700"
          }`}
        >
          Add New Habit
        </h2>

        {/* Habit Name */}
        <div className="mb-4">
          <label
            className={`block mb-1 font-medium ${
              isDarkMode ? themeClasses.text : ""
            }`}
          >
            Habit Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border transition-all duration-150 ${
              isDarkMode
                ? "bg-gray-800 text-white border-gray-700 focus:border-indigo-500"
                : "bg-gray-100 text-black border-gray-300 focus:border-indigo-500"
            }`}
            placeholder="e.g., Drink 8 glasses of water"
            required
          />
        </div>

        {/* Choose Icon */}
        <div className="mb-4">
          <label
            className={`block mb-1 font-medium ${
              isDarkMode ? themeClasses.text : ""
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
                  form.icon === opt.icon
                    ? "border-indigo-500 bg-indigo-500"
                    : isDarkMode
                    ? "border-gray-700 bg-gray-800 hover:bg-gray-700 active:bg-gray-900"
                    : "border-gray-300 bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
                }`}
                onClick={() => handleIconSelect(opt.icon)}
                aria-label={opt.label}
                style={{
                  boxShadow:
                    form.icon === opt.icon
                      ? "0 0 0 2px rgba(99,102,241,0.3)"
                      : "none",
                }}
              >
                <opt.icon
                  size={24}
                  className={
                    form.icon === opt.icon
                      ? "text-white"
                      : isDarkMode
                      ? "text-gray-300"
                      : "text-gray-500"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Choose Color */}
        <div className="mb-4">
          <label
            className={`block mb-1 font-medium ${
              isDarkMode ? themeClasses.text : ""
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
                  form.iconColor === color.className
                    ? "border-indigo-500"
                    : "border-gray-300"
                }`}
                style={{
                  backgroundColor: color.hex,
                  boxShadow:
                    form.iconColor === color.className
                      ? "0 0 0 2px rgba(99,102,241,0.3)"
                      : "none",
                }}
                onClick={() => handleColorSelect(color.className)}
                aria-label={color.name}
              >
                {form.iconColor === color.className && (
                  <span className="text-white text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div className="mb-4">
          <label
            className={`block mb-1 font-medium ${
              isDarkMode ? themeClasses.text : ""
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
                  form.frequency === freq
                    ? "bg-indigo-500 text-white"
                    : isDarkMode
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                }`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, frequency: freq }))
                }
                style={{
                  boxShadow:
                    form.frequency === freq
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
                isDarkMode ? themeClasses.text : ""
              }`}
            >
              Daily Goal
            </label>
            <input
              type="number"
              name="dailyGoal"
              value={form.dailyGoal}
              onChange={handleChange}
              min={1}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-150 ${
                isDarkMode
                  ? "bg-gray-800 text-white border-gray-700 focus:border-indigo-500"
                  : "bg-gray-100 text-black border-gray-300 focus:border-indigo-500"
              }`}
              required
            />
          </div>
          <div className="flex-1">
            <label
              className={`block mb-1 font-medium ${
                isDarkMode ? themeClasses.text : ""
              }`}
            >
              Unit
            </label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border transition-all duration-150 ${
                isDarkMode
                  ? "bg-gray-800 text-white border-gray-700 focus:border-indigo-500"
                  : "bg-gray-100 text-black border-gray-300 focus:border-indigo-500"
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
              isDarkMode ? themeClasses.text : ""
            }`}
          >
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className={`w-full px-4 py-2 rounded-lg border transition-all duration-150 ${
              isDarkMode
                ? "bg-gray-800 text-white border-gray-700 focus:border-indigo-500 placeholder:text-gray-400"
                : "bg-gray-100 text-black border-gray-300 focus:border-indigo-500 placeholder:text-gray-600"
            }`}
            placeholder="Add any notes or motivation for this habit..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg border transition-all duration-150 ${
              isDarkMode
                ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600 active:bg-gray-900"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 active:bg-gray-300"
            }`}
            onClick={() => navigate("/habits")}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg border bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition-all duration-150`}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Creating..." : "Create Habit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHabits;
