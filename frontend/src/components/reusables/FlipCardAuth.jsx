import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../LoginForm";
import RegisterForm from "../RegisterForm";

// Indigo palette (Tailwind)
const INDIGO_LIGHT = "#a5b4fc"; // indigo-300
const INDIGO_MAIN = "#6366f1"; // indigo-600
const INDIGO_MID = "#818cf8"; // indigo-400
const INDIGO_DARK = "#312e81"; // indigo-900
const INDIGO_DEEP = "#3730a3"; // indigo-800

const FlipCardAuth = ({ onAuthSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(location.pathname === "/register");

  useEffect(() => {
    setIsFlipped(location.pathname === "/register");
  }, [location.pathname]);

  const handleSwitchToRegister = () => {
    setIsFlipped(true);
    setTimeout(() => {
      navigate("/register");
    }, 400);
  };

  const handleSwitchToLogin = () => {
    setIsFlipped(false);
    setTimeout(() => {
      navigate("/login");
    }, 400);
  };

  // Indigo gradients for spotlights, indigo-600 as main
  const spotlight1Bg = `radial-gradient(circle at 20% 40%, ${INDIGO_LIGHT} 0%, ${INDIGO_MAIN} 60%, ${INDIGO_DARK} 100%)`;
  const spotlight2Bg = `radial-gradient(circle at 80% 80%, ${INDIGO_DARK} 0%, ${INDIGO_MAIN} 60%, ${INDIGO_MID} 100%)`;

  return (
    <div className="flip-card-container min-h-screen font-sans overflow-hidden bg-black relative flex items-center justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body, .font-sans { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
        .flip-card-container { perspective: 1000px; }
        .flip-card {
          position: relative;
          width: 100%;
          max-width: 28rem;
          height: 600px;
          margin: auto;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flip-card-front {
          z-index: ${!isFlipped ? 2 : 1};
          pointer-events: ${!isFlipped ? "auto" : "none"};
        }
        .flip-card-back {
          transform: rotateY(180deg);
          z-index: ${isFlipped ? 2 : 1};
          pointer-events: ${isFlipped ? "auto" : "none"};
        }
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
      `}</style>

      {/* Animated indigo spotlights */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="w-2/3 h-2/3 absolute top-0 left-0 rounded-full spotlight-1"
          style={{ background: spotlight1Bg }}
        />
        <div
          className="w-1/2 h-1/2 absolute bottom-0 right-0 rounded-full spotlight-2"
          style={{ background: spotlight2Bg }}
        />
        <div className="dimming-layer" />
      </div>

      {/* Flip card container positioned over the background */}
      <div className={`flip-card z-10 ${isFlipped ? "flipped" : ""}`}>
        <div className="flip-card-inner">
          {/* Front Side - Login */}
          <div className="flip-card-front">
            <LoginForm
              onAuthSuccess={onAuthSuccess}
              onSwitchToRegister={handleSwitchToRegister}
            />
          </div>

          {/* Back Side - Register */}
          <div className="flip-card-back">
            <RegisterForm
              onAuthSuccess={onAuthSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipCardAuth;
