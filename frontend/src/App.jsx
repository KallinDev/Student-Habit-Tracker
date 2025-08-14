import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Sidebar from "./components/reusables/Sidebar.jsx";
import { ThemeProvider } from "./components/reusables/ThemeProvider.jsx";
import Habits from "./components/Habits.jsx";

const Layout = () => {
  const [firstName] = useState("Gustav");
  return (
    <div className="flex h-screen">
      <Sidebar firstName={firstName} />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/habits" element={<Habits />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
