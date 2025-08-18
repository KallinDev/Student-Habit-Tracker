import React, { useContext } from "react";
import { ThemeContext } from "./reusables/ThemeContext.js";

const About = () => {
  const { themeClasses, isDarkMode } = useContext(ThemeContext);

  // Card styles
  const cardClass = `rounded-xl shadow-sm ${themeClasses.cardBg} border ${themeClasses.border} p-8 h-full flex flex-col`;
  const infoCardClass = `rounded-xl shadow-sm bg-indigo-500 text-white p-6 flex flex-col items-center justify-center mb-6`;
  const statCardClass = `rounded-xl shadow-sm ${themeClasses.cardBg} border ${themeClasses.border} p-6 flex flex-col items-center justify-center min-w-[180px]`;

  // Text color for main content
  const mainTextColor = isDarkMode ? "text-white" : "text-black";
  const secondaryTextColor = isDarkMode ? "text-gray-200" : "text-gray-700";
  const mutedTextColor = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`min-h-screen ${themeClasses.mainBg} pb-8`}>
      <div className="max-w-6xl mx-auto px-6 pt-10">
        {/* Indigo Info Card */}
        <div className={infoCardClass}>
          <h2 className="text-2xl font-bold mb-2">Student Habit Tracker</h2>
          <p className="mb-2 text-center">
            Empowering students to build better habits, achieve their goals, and
            create lasting positive changes in their academic and personal
            lives.
          </p>
          <span
            className={`bg-indigo-600 rounded-full px-4 py-1 text-xs font-semibold mt-2 text-white`}
          >
            Version 2.1.0
          </span>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Mission & Features */}
          <div className="md:col-span-2 flex flex-col">
            <div className={`${cardClass} flex-1`}>
              <h3 className={`font-semibold mb-4 ${mainTextColor} text-xl`}>
                Our Mission
              </h3>
              <p
                className={`mb-8 text-base leading-relaxed ${secondaryTextColor}`}
              >
                We believe that small, consistent actions lead to extraordinary
                results. Our Student Habit Tracker is designed specifically for
                students who want to build productive habits, improve their
                academic performance, and develop lifelong skills for success.
              </p>
              <h4 className={`font-semibold mb-4 ${mainTextColor} text-lg`}>
                Key Features
              </h4>
              <ul className="mb-8 text-base space-y-6">
                <li className={`flex items-start gap-3 ${secondaryTextColor}`}>
                  <span className="text-indigo-500 text-xl">📊</span>
                  <span>
                    <b>Smart Analytics:</b> Track your progress with detailed
                    charts and insights that help you understand your habit
                    patterns.
                  </span>
                </li>
                <li className={`flex items-start gap-3 ${secondaryTextColor}`}>
                  <span className="text-pink-500 text-xl">🎯</span>
                  <span>
                    <b>Goal Setting:</b> Set realistic, achievable goals and
                    monitor your success rates over time.
                  </span>
                </li>
                <li className={`flex items-start gap-3 ${secondaryTextColor}`}>
                  <span className="text-purple-500 text-xl">🗓️</span>
                  <span>
                    <b>Visual Calendar:</b> See your habit completion at a
                    glance with our intuitive calendar view.
                  </span>
                </li>
                <li className={`flex items-start gap-3 ${secondaryTextColor}`}>
                  <span className="text-green-500 text-xl">🔔</span>
                  <span>
                    <b>Smart Reminders:</b> Never forget your habits with
                    customizable notifications and gentle nudges.
                  </span>
                </li>
                <li className={`flex items-start gap-3 ${secondaryTextColor}`}>
                  <span className="text-yellow-500 text-xl">🏆</span>
                  <span>
                    <b>Achievement System:</b> Celebrate your wins with streaks,
                    badges, and milestone rewards.
                  </span>
                </li>
              </ul>
              <h4 className={`font-semibold mb-4 ${mainTextColor} text-lg`}>
                Why Choose Our App?
              </h4>
              <p
                className={`text-base leading-relaxed ${secondaryTextColor} mb-2`}
              >
                Unlike generic habit trackers, we're built specifically for
                students. We understand the unique challenges of academic life -
                from irregular schedules to exam stress. Our app adapts to your
                student lifestyle, making habit building sustainable and
                enjoyable.
              </p>
              {/* Spacer to push content down if needed */}
              <div className="flex-1" />
            </div>
          </div>
          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <div className={cardClass}>
              <b className={mainTextColor}>Getting Started</b>
              <p className={`text-xs mt-2 mb-2 ${mutedTextColor}`}>
                New to habit tracking? Check out our comprehensive guide to
                building lasting habits.
              </p>
              <a
                href="#"
                className="text-xs text-indigo-500 mt-2 hover:underline"
              >
                Read the guide →
              </a>
            </div>
            <div className={cardClass}>
              <b className={mainTextColor}>Help Center</b>
              <p className={`text-xs mt-2 mb-2 ${mutedTextColor}`}>
                Find answers to common questions, troubleshooting tips, and
                detailed feature explanations.
              </p>
              <a
                href="#"
                className="text-xs text-indigo-500 mt-2 hover:underline"
              >
                Visit help center →
              </a>
            </div>
            <div className={cardClass}>
              <b className={mainTextColor}>Community</b>
              <p className={`text-xs mt-2 mb-2 ${mutedTextColor}`}>
                Join thousands of students sharing tips, motivation, and
                celebrating successes together.
              </p>
              <a
                href="#"
                className="text-xs text-indigo-500 mt-2 hover:underline"
              >
                Join community →
              </a>
            </div>
            <div className={cardClass}>
              <b className={mainTextColor}>Contact Us</b>
              <p className={`text-xs mt-2 mb-2 ${mutedTextColor}`}>
                Have questions or feedback? We'd love to hear from you!
              </p>
              <a
                href="#"
                className="text-xs text-indigo-500 mt-2 hover:underline"
              >
                Get in touch →
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-2">
          <div className={statCardClass}>
            <div className="text-2xl font-bold text-indigo-500 mb-1">50K+</div>
            <div className={`text-xs ${mutedTextColor}`}>Active Students</div>
          </div>
          <div className={statCardClass}>
            <div className="text-2xl font-bold text-indigo-500 mb-1">2M+</div>
            <div className={`text-xs ${mutedTextColor}`}>Habits Completed</div>
          </div>
          <div className={statCardClass}>
            <div className="text-2xl font-bold text-indigo-500 mb-1">89%</div>
            <div className={`text-xs ${mutedTextColor}`}>Success Rate</div>
          </div>
          <div className={statCardClass}>
            <div className="text-2xl font-bold text-indigo-500 mb-1">4.8★</div>
            <div className={`text-xs ${mutedTextColor}`}>User Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
