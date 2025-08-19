import React, { useState, useEffect, useContext, useRef } from "react";
import { ThemeContext } from "./reusables/ThemeContext.js";

// Use API_BASE for all backend requests
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

const ProfileContent = () => {
  const { isDarkMode, themeClasses } = useContext(ThemeContext);

  // Initial state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);

  // For editing/cancel
  const [editState, setEditState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    timezone: "",
    language: "",
    profileImage: "",
  });

  // Modal state and animation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Profile image modal state and animation
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Feedback message
  const [feedback, setFeedback] = useState("");

  // Stats state (dynamic)
  const [stats, setStats] = useState({
    activeHabits: 0,
    totalDays: 0,
    successRate: "0%",
    bestStreak: 0,
  });

  // Ref for file input
  const fileInputRef = useRef(null);

  // Load profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const res = await fetch(`${API_BASE}/api/user/profile`, {
          headers: {
            "user-id": userId,
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setTimezone(data.timezone || "");
        setLanguage(data.language || "");
        setProfileImage(data.profileImage || "");
        setEditState({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          timezone: data.timezone || "",
          language: data.language || "",
          profileImage: data.profileImage || "",
        });
        setMemberSince(data.memberSince || "");
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setFirstName("Student");
        setLastName("User");
        setEmail("student@example.com");
        setTimezone("Europe/Stockholm");
        setLanguage("English");
        setProfileImage("");
        setEditState({
          firstName: "Student",
          lastName: "User",
          email: "student@example.com",
          timezone: "Europe/Stockholm",
          language: "English",
          profileImage: "",
        });
        setMemberSince("");
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        const res = await fetch(`${API_BASE}/api/user/stats`, {
          headers: {
            "user-id": userId,
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();

        setStats({
          activeHabits: data.activeHabits ?? data.active_habits ?? 0,
          totalDays: data.totalDays ?? data.total_days ?? 0,
          successRate:
            typeof data.successRate === "number"
              ? `${Math.max(0, Math.min(100, data.successRate))}%`
              : typeof data.success_rate === "number"
              ? `${Math.max(0, Math.min(100, data.success_rate))}%`
              : "0%",
          bestStreak: data.bestStreak ?? data.best_streak ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
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

  // Modal animation logic
  useEffect(() => {
    if (showDeleteModal) setModalVisible(true);
    else if (modalVisible) {
      const timer = setTimeout(() => setModalVisible(false), 350);
      return () => clearTimeout(timer);
    }
  }, [showDeleteModal, modalVisible]);

  // Profile image modal animation logic
  useEffect(() => {
    if (showImageModal) setImageModalVisible(true);
    else if (imageModalVisible) {
      const timer = setTimeout(() => setImageModalVisible(false), 350);
      return () => clearTimeout(timer);
    }
  }, [showImageModal, imageModalVisible]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleEditChange = (field, value) => {
    setEditState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setEditState({
      firstName,
      lastName,
      email,
      timezone,
      language,
      profileImage,
    });
    setFeedback("Changes cancelled");
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(editState),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setFirstName(editState.firstName);
      setLastName(editState.lastName);
      setEmail(editState.email);
      setTimezone(editState.timezone);
      setLanguage(editState.language);
      setProfileImage(editState.profileImage);
      setFeedback("Profile saved!");
      window.dispatchEvent(new Event("profileUpdated"));
      localStorage.setItem("profileUpdated", Date.now().toString());
    } catch (error) {
      console.error("Failed to save profile:", error);
      setFeedback("Failed to save profile");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      await fetch(`${API_BASE}/api/user/delete`, {
        method: "DELETE",
        headers: {
          "user-id": userId,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        credentials: "include",
      });
      setShowDeleteModal(false);
      // Clear localStorage and redirect to login
      localStorage.clear();
      window.location.href = "/login"; // or your login route
    } catch (error) {
      console.error("Failed to delete account:", error);
      setShowDeleteModal(false);
    }
  };

  // Open profile image modal
  const handleProfileImageModalOpen = (e) => {
    e.stopPropagation();
    setShowImageModal(true);
  };

  // Browse for new image
  const handleProfileImageClick = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditState((prev) => ({
          ...prev,
          profileImage: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
    setShowImageModal(false);
  };

  // Remove profile image handler
  const handleRemoveProfileImage = (e) => {
    e.stopPropagation();
    setEditState((prev) => ({
      ...prev,
      profileImage: "",
    }));
    setShowImageModal(false);
  };

  // Format memberSince date
  const getMemberSinceText = () => {
    if (!memberSince) return "";
    const date = new Date(memberSince);
    if (isNaN(date)) return "";
    const formatted = date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className={`flex h-screen ${themeClasses.mainBg}`}>
      <div className="flex-1 overflow-auto p-8">
        <h1 className={`text-3xl font-bold ${themeClasses.text} mb-8`}>
          Profile
        </h1>
        {/* Feedback message */}
        {feedback && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg text-center font-semibold transition-all duration-300 ${
              feedback === "Profile saved!"
                ? "bg-green-100 text-green-700"
                : feedback === "Changes cancelled"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}
        {/* Profile Header */}
        <div
          className={`${themeClasses.cardBg} rounded-2xl shadow-sm border ${themeClasses.border} p-6 mb-6`}
        >
          <div className="flex items-center gap-4">
            {/* Avatar block with pen icon */}
            <div className="relative flex items-center justify-center w-16 h-16 cursor-pointer group">
              {/* Profile circle */}
              <div
                className="w-16 h-16 rounded-full border-2 border-indigo-500 flex items-center justify-center bg-indigo-500 relative"
                style={{
                  background: editState.profileImage
                    ? "transparent"
                    : "#6366f1",
                }}
              >
                {editState.profileImage ? (
                  <img
                    src={
                      editState.profileImage.startsWith("data:image")
                        ? editState.profileImage
                        : `data:image/jpeg;base64,${editState.profileImage}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full block"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {editState.firstName.charAt(0)}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleProfileImageChange}
                />
                {/* Hover overlay with pen icon */}
                <button
                  type="button"
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-75 transition-opacity z-20 bg-black bg-opacity-50 cursor-pointer"
                  style={{ pointerEvents: "auto" }}
                  title="Change profile picture"
                  onClick={handleProfileImageModalOpen}
                  tabIndex={0}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 20h4l10.06-10.06a1.5 1.5 0 0 0-2.12-2.12L6 17.88V20zm14.85-13.44a3.5 3.5 0 0 1 0 4.95l-1.41 1.41-4.95-4.95 1.41-1.41a3.5 3.5 0 0 1 4.95 0z"
                      fill="#fff"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                {editState.firstName} {editState.lastName}
              </h2>
              <p className={`text-sm ${themeClasses.textMuted}`}>
                {editState.email}
              </p>
              <p className={`text-xs ${themeClasses.textMuted}`}>
                Member since {getMemberSinceText()}
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
        {/* Profile Image Modal */}
        {(showImageModal || imageModalVisible) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div
              className={`rounded-2xl shadow-2xl p-8 max-w-sm w-full
                ${themeClasses.cardBg} ${themeClasses.text}
                ${showImageModal ? "animate-fadeInUp" : "animate-fadeOutDown"}`}
              style={{
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.10)",
              }}
            >
              <h2 className="text-lg font-bold mb-6 text-indigo-500">
                Change Profile Picture
              </h2>
              <div className="flex flex-col gap-4">
                <button
                  className={`w-full px-4 py-3 rounded-xl border ${
                    themeClasses.border
                  } ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white"
                      : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800"
                  } flex items-center gap-3 font-semibold transition-all duration-200 cursor-pointer`}
                  onClick={handleProfileImageClick}
                  type="button"
                >
                  <svg
                    className="w-6 h-6 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.586-6.586a2 2 0 00-2.828-2.828z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7V3a1 1 0 00-1-1h-4a1 1 0 00-1 1v4"
                    />
                  </svg>
                  Browse for new image
                </button>
                <button
                  className={`w-full px-4 py-3 rounded-xl border ${
                    themeClasses.border
                  } ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white"
                      : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800"
                  } flex items-center gap-3 font-semibold transition-all duration-200 cursor-pointer`}
                  onClick={handleRemoveProfileImage}
                  disabled={!editState.profileImage}
                  type="button"
                  style={{
                    opacity: editState.profileImage ? 1 : 0.5,
                    cursor: editState.profileImage ? "pointer" : "not-allowed",
                  }}
                >
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Remove current image
                </button>
                <button
                  className={`w-full px-4 py-2 mt-2 rounded-xl border ${
                    themeClasses.border
                  } ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-gray-200"
                      : "bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-700"
                  } font-semibold transition-all duration-200 cursor-pointer`}
                  onClick={() => setShowImageModal(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
            <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(40px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes fadeOutDown {
                from {
                  opacity: 1;
                  transform: translateY(0);
                }
                to {
                  opacity: 0;
                  transform: translateY(40px);
                }
              }
              .animate-fadeInUp {
                animation: fadeInUp 0.35s cubic-bezier(.4,0,.2,1) both;
              }
              .animate-fadeOutDown {
                animation: fadeOutDown 0.35s cubic-bezier(.4,0,.2,1) both;
              }
            `}</style>
          </div>
        )}

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
                value={editState.firstName}
                onChange={(e) => handleEditChange("firstName", e.target.value)}
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
                value={editState.lastName}
                onChange={(e) => handleEditChange("lastName", e.target.value)}
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
                value={editState.email}
                onChange={(e) => handleEditChange("email", e.target.value)}
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
                value={editState.timezone}
                onChange={(e) => handleEditChange("timezone", e.target.value)}
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
                value={editState.language}
                onChange={(e) => handleEditChange("language", e.target.value)}
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
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700 active:bg-gray-900"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 active:bg-gray-300"
              } focus:ring-2 focus:ring-indigo-400 active:scale-95 transition-all duration-200`}
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-400 active:scale-95 transition-all duration-200"
              type="button"
              onClick={handleSave}
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
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
        </div>
        {/* Delete Account Modal */}
        {(showDeleteModal || modalVisible) && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
            style={{ background: "none" }}
          >
            <div
              className={`rounded-2xl shadow-2xl p-8 max-w-md w-full
                ${themeClasses.cardBg} ${themeClasses.text}
                ${
                  showDeleteModal ? "animate-fadeInUp" : "animate-fadeOutDown"
                }`}
              style={{
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,0,0,0.10)",
              }}
            >
              <h2 className="text-xl font-bold mb-4 text-red-500">
                Confirm Account Deletion
              </h2>
              <p className="mb-6">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  className={`px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700 active:bg-gray-900"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 active:bg-gray-300"
                  } transition-colors duration-300 focus:ring-2 focus:ring-indigo-400 active:scale-95`}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-lg border border-red-500 bg-red-500 text-white transition-colors duration-300 hover:bg-red-600 focus:ring-2 focus:ring-red-400 active:scale-95"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
            <style>{`
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(40px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes fadeOutDown {
                from {
                  opacity: 1;
                  transform: translateY(0);
                }
                to {
                  opacity: 0;
                  transform: translateY(40px);
                }
              }
              .animate-fadeInUp {
                animation: fadeInUp 0.35s cubic-bezier(.4,0,.2,1) both;
              }
              .animate-fadeOutDown {
                animation: fadeOutDown 0.35s cubic-bezier(.4,0,.2,1) both;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  return <ProfileContent />;
};

export default Profile;
