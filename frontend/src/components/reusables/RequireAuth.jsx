import React from "react";
import { Navigate } from "react-router-dom";

// Checks for a token or userId in localStorage
const RequireAuth = ({ children }) => {
  const isLoggedIn =
    Boolean(localStorage.getItem("token")) ||
    Boolean(localStorage.getItem("userId"));
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default RequireAuth;
