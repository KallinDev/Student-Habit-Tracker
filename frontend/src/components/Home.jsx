import React from "react";
import { Book, Dumbbell, Brain, Target } from "lucide-react";

// Indigo palette
const INDIGO_LIGHT = "#a5b4fc"; // indigo-300
const INDIGO_MAIN = "#6366f1"; // indigo-600
const INDIGO_MID = "#818cf8"; // indigo-400
const INDIGO_DARK = "#312e81"; // indigo-900
const INDIGO_DEEP = "#3730a3"; // indigo-800

const spotlight1Bg = `radial-gradient(circle at 20% 40%, ${INDIGO_LIGHT} 0%, ${INDIGO_MAIN} 60%, ${INDIGO_DARK} 100%)`;
const spotlight2Bg = `radial-gradient(circle at 80% 80%, ${INDIGO_DARK} 0%, ${INDIGO_MAIN} 60%, ${INDIGO_MID} 100%)`;

const features = [
  {
    icon: <Book size={32} className="text-indigo-500 mb-2" />,
    title: "Track Study Habits",
    desc: "Stay on top of your assignments and study routines with smart reminders.",
  },
  {
    icon: <Dumbbell size={32} className="text-indigo-500 mb-2" />,
    title: "Wellness Goals",
    desc: "Balance your academic life with healthy habits for body and mind.",
  },
  {
    icon: <Brain size={32} className="text-indigo-500 mb-2" />,
    title: "Personal Growth",
    desc: "Build positive routines and track your progress over time.",
  },
  {
    icon: <Target size={32} className="text-indigo-500 mb-2" />,
    title: "Achieve Milestones",
    desc: "Set goals, celebrate wins, and stay motivated every day.",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden bg-gray-900 relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body, .font-sans { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
        @keyframes float-spotlight-1 {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(120px, 80px) scale(1.25);}
          50%  { transform: translate(60px, 160px) scale(1.35);}
          75%  { transform: translate(-80px, 80px) scale(1.18);}
          100% { transform: translate(0, 0) scale(1);}
        }
        @keyframes float-spotlight-2 {
          0%   { transform: translate(0, 0) scale(1);}
          25%  { transform: translate(-120px, -80px) scale(1.28);}
          50%  { transform: translate(-60px, -160px) scale(1.38);}
          75%  { transform: translate(80px, -80px) scale(1.22);}
          100% { transform: translate(0, 0) scale(1);}
        }
        .spotlight-1 {
          animation: float-spotlight-1 18s ease-in-out infinite;
          opacity: 0.5;
          filter: blur(80px);
          will-change: transform;
        }
        .spotlight-2 {
          animation: float-spotlight-2 22s ease-in-out infinite;
          opacity: 0.42;
          filter: blur(64px);
          will-change: transform;
        }
        .dimming-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom right, #18181b 80%, #312e81 100%);
          opacity: 0.45;
          z-index: 1;
          pointer-events: none;
        }
        .animate-fade-in {
          animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cta-bounce {
          animation: ctaBounce 1.2s infinite alternate cubic-bezier(.68,-0.55,.27,1.55);
        }
        @keyframes ctaBounce {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); box-shadow: 0 0 32px 0 #6366f1aa; }
        }
      `}</style>

      {/* Animated indigo spotlights */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="w-2/3 h-2/3 absolute top-0 left-0 rounded-full spotlight-1"
          style={{ background: spotlight1Bg }}
        ></div>
        <div
          className="w-1/2 h-1/2 absolute bottom-0 right-0 rounded-full spotlight-2"
          style={{ background: spotlight2Bg }}
        ></div>
        <div className="dimming-layer" />
      </div>

      {/* Header */}
      <header className="w-full flex flex-row justify-between items-center py-4 px-4 sm:py-6 sm:px-6 md:px-12 relative z-10 animate-fade-in gap-2">
        <div className="flex items-center gap-2">
          <Brain size={32} className="text-indigo-500 animate-pulse" />
          <span className="text-xl font-bold text-indigo-500 tracking-tight">
            Student Habit Tracker
          </span>
        </div>
        <a
          href="/login"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition text-sm"
        >
          Login
        </a>
      </header>
      {/* Main content centered */}
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 pb-6 sm:pb-10 flex flex-col relative z-10">
          {/* Hero Section */}
          <div
            className="flex flex-col-reverse sm:flex-row items-center justify-between gap-8 sm:gap-10 mb-10 sm:mb-16 animate-fade-in"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <div className="flex-1 w-full sm:w-auto">
              <h1
                className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 text-white animate-fade-in"
                style={{ animationDelay: "0.3s", animationFillMode: "both" }}
              >
                Build Habits. Achieve Goals.
              </h1>
              <p
                className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-300 animate-fade-in"
                style={{ animationDelay: "0.4s", animationFillMode: "both" }}
              >
                The all-in-one habit tracker for students. Stay motivated,
                organized, and grow every day.
              </p>
              <a
                href="/register"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-xl shadow-lg transition cta-bounce text-base sm:text-lg"
                style={{ animationDelay: "0.5s", animationFillMode: "both" }}
              >
                Start Your Journey
              </a>
            </div>
            <div className="flex-1 flex justify-center w-full sm:w-auto mb-6 sm:mb-0">
              {/* Animated Illustration/Icon */}
              <div className="bg-indigo-900 rounded-full p-6 sm:p-8 shadow-lg flex items-center justify-center animate-pulse">
                <Brain size={70} className="text-indigo-500 sm:hidden" />
                <Brain size={100} className="text-indigo-500 hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="w-full overflow-x-auto">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10 min-w-[320px]">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-xl shadow-sm bg-gray-800 border border-gray-700 p-4 sm:p-6 flex flex-col items-center text-center animate-fade-in"
                  style={{
                    animationDelay: `${0.6 + i * 0.1}s`,
                    animationFillMode: "both",
                  }}
                >
                  {f.icon}
                  <h3 className="font-semibold mb-2 text-white">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Footer/Info always visible at bottom, no scroll needed */}
      <footer
        className="w-full text-center py-6 text-xs text-gray-400 animate-fade-in mt-auto"
        style={{ animationDelay: "1.2s", animationFillMode: "both" }}
      >
        &copy; {new Date().getFullYear()} Student Habit Tracker. All rights
        reserved.
      </footer>
    </div>
  );
};

export default Home;
