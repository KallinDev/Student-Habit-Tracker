import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Sidebar from "./components/reusables/Sidebar.jsx";
import { ThemeProvider } from "./components/reusables/ThemeProvider.jsx";
import Habits from "./components/Habits.jsx";
import AddHabits from "./components/AddHabits.jsx";
import Progress from "./components/Progress.jsx";
import About from "./components/About.jsx";
import FlipCardAuth from "./components/reusables/FlipCardAuth.jsx";
import Home from "./components/Home.jsx";

const Layout = () => {
  const [firstName] = useState("Gustav");
  return (
    <div className="flex h-screen">
      {/* Sidebar only on desktop */}
      <div className="hidden lg:flex h-full">
        <Sidebar firstName={firstName} />
      </div>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

const AuthRoutes = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <Routes>
      <Route
        path="/*"
        element={<FlipCardAuth onAuthSuccess={handleAuthSuccess} />}
      />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthRoutes />} />
          <Route path="/register" element={<AuthRoutes />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/add-habit" element={<AddHabits />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
