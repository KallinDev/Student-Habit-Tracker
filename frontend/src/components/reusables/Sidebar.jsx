import React, {
  useContext,
  useLayoutEffect,
  useState,
  useRef,
  useEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, LogOut, User, BarChart3, Target, Info } from "lucide-react";
import { ThemeContext } from "./ThemeContext.js";

// Listen for profile updates across tabs/components
const PROFILE_UPDATED_EVENT = "profileUpdated";

const Sidebar = () => {
  const { isDarkMode, toggleTheme, themeClasses } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { name: "Profile", icon: User, path: "/profile" },
    { name: "My Habits", icon: Target, path: "/habits" },
    { name: "Progress", icon: BarChart3, path: "/progress" },
    { name: "About", icon: Info, path: "/about" },
  ];

  const buttonsRef = useRef([]);

  const getIndicatorStyle = () => {
    const activeIndex = sidebarItems.findIndex((item) =>
      isActivePage(item.path)
    );
    const activeButton = buttonsRef.current[activeIndex];
    if (activeButton) {
      return {
        top: activeButton.offsetTop,
        height: activeButton.offsetHeight,
      };
    }
    return { top: 0, height: 40 };
  };

  const isActivePage = (path) => {
    if (path === "/dashboard" && location.pathname === "/dashboard")
      return true;
    if (path !== "/dashboard" && location.pathname.startsWith(path))
      return true;
    return false;
  };

  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 40 });

  useLayoutEffect(() => {
    setIndicatorStyle(getIndicatorStyle());
    // eslint-disable-next-line
  }, [location.pathname, sidebarItems.length]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  // --- Fetch user profile for sidebar ---
  const [firstName, setFirstName] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // Fetch profile data using logged-in userId
  const fetchProfile = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const res = await fetch(
        "https://student-habit-tracker.onrender.com/api/user/profile",
        {
          headers: { "user-id": userId },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setFirstName(data.firstName || "User");
      setProfileImage(data.profileImage || "");
    } catch {
      setFirstName("User");
      setProfileImage("");
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen for profile updates (from Profile.jsx)
    const handler = () => fetchProfile();
    window.addEventListener(PROFILE_UPDATED_EVENT, handler);

    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handler);
    };
  }, []);

  // Listen for localStorage changes (cross-tab instant update)
  useEffect(() => {
    const storageHandler = (e) => {
      if (e.key === "profileUpdated") {
        fetchProfile();
      }
    };
    window.addEventListener("storage", storageHandler);
    return () => window.removeEventListener("storage", storageHandler);
  }, []);

  // Default profile: purple circle with first initial
  const renderDefaultProfile = () => (
    <div className="w-full h-full flex items-center justify-center bg-indigo-500">
      <span className="text-white text-xl font-bold">
        {firstName ? firstName.charAt(0) : "U"}
      </span>
    </div>
  );

  // --- Modal state and animation ---
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    if (showLogoutModal) setLogoutModalVisible(true);
    else if (logoutModalVisible) {
      const timer = setTimeout(() => setLogoutModalVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showLogoutModal, logoutModalVisible]);

  // --- Sign Out handler ---
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setShowLogoutModal(false);
    navigate("/");
  };

  return (
    <div
      className={`w-64 ${themeClasses.sidebarBg} shadow-sm border-r ${themeClasses.border} relative`}
    >
      <div className="p-6">
        {/* Profile in Sidebar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center mb-3 border-2 border-indigo-500 bg-indigo-500">
            {profileImage ? (
              <img
                src={
                  profileImage.startsWith("data:image")
                    ? profileImage
                    : `data:image/jpeg;base64,${profileImage}`
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              renderDefaultProfile()
            )}
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
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative space-y-2">
          {/* Indicator (with sliding animation) */}
          <div
            className="absolute left-0 w-1 bg-indigo-600 rounded"
            style={{
              top: indicatorStyle.top,
              height: indicatorStyle.height,
              transition:
                "top 0.3s cubic-bezier(0.4,0,0.2,1), height 0.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          ></div>

          {sidebarItems.map((item, index) => (
            <button
              key={item.name}
              ref={(el) => (buttonsRef.current[index] = el)}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                isActivePage(item.path)
                  ? `${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`
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

      {/* Dark Mode Toggle */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <button
          onClick={toggleTheme}
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

      {/* Logout Confirmation Modal */}
      {(showLogoutModal || logoutModalVisible) && (
        <div
          className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full flex justify-center ${
            showLogoutModal ? "modal-in" : "modal-out"
          }`}
          style={{
            transitionProperty: "opacity, transform",
            willChange: "opacity, transform",
          }}
        >
          <form
            className={`rounded-xl p-8 shadow-lg w-full max-w-2xl border ${
              isDarkMode
                ? "bg-gray-800 border-indigo-500"
                : "bg-white border-indigo-500"
            }`}
            onSubmit={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
          >
            <h2
              className={`text-xl font-bold mb-4 ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              Confirm Sign Out
            </h2>
            <p className={`mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className={`px-4 py-2 rounded btn-base transition-all duration-300 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-black"
                }`}
                onClick={() => setShowLogoutModal(false)}
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
                Sign Out
              </button>
            </div>
          </form>
          <style>{`
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
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
