import React, { useContext, useLayoutEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, LogOut, User, BarChart3, Target, Info } from "lucide-react";
import { ThemeContext } from "./ThemeContext.js";

const Sidebar = ({ firstName }) => {
  const { isDarkMode, toggleTheme, themeClasses } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    { name: "Dashboard", icon: BarChart3, path: "/" },
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
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
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

  return (
    <div
      className={`w-64 ${themeClasses.sidebarBg} shadow-sm border-r ${themeClasses.border} relative`}
    >
      <div className="p-6">
        {/* Profile in Sidebar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3">
            {firstName?.charAt(0) || "?"}
          </div>
          <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
            Welcome, {firstName || "User"}
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
        <nav className="relative space-y-2">
          {/* Indicator (with sliding animation) */}
          <div
            className="absolute left-0 w-1 bg-indigo-700 rounded"
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
    </div>
  );
};

export default Sidebar;
