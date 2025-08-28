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
import RequireAuth from "./components/reusables/RequireAuth.jsx";

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
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/habits"
              element={
                <RequireAuth>
                  <Habits />
                </RequireAuth>
              }
            />
            <Route
              path="/add-habit"
              element={
                <RequireAuth>
                  <AddHabits />
                </RequireAuth>
              }
            />
            <Route
              path="/progress"
              element={
                <RequireAuth>
                  <Progress />
                </RequireAuth>
              }
            />
            <Route
              path="/about"
              element={
                <RequireAuth>
                  <About />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
