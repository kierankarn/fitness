import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./AuthContext";
import Login from "./pages/Login";
import SessionsList from "./pages/Admin";
import Activities from "./pages/Activities";
import SessionDetail from "./pages/SessionDetail";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import LogDetail from "./pages/LogDetail";
import BackdateSession from "./pages/BackdateSession";
import EditCheckIn from "./pages/EditCheckIn";
import CheckIns from "./pages/CheckIns";
import NewCheckIn from "./pages/NewCheckIn";
import BackdateCheckIn from "./pages/BackdateCheckIn";
import "./scss/app.scss";

function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
}

function HeaderWrapper() {
  const { user } = useContext(AuthContext);
  return user ? <Header /> : null;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    // Detect system preference initially
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const color = theme === "dark" ? "#121212" : "#d32f2f"; // Customize to match your colors
      themeColorMeta.setAttribute("content", color);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <HeaderWrapper />
        {/* Theme toggle button */}
        <div style={{ padding: "1rem", textAlign: "right" }}>
          <button onClick={toggleTheme} className="button button-outline-secondary">
            {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          </button>
        </div>
        <section className="site-main">
          <div className="site__wrapper">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><SessionsList /></PrivateRoute>} />
              <Route path="/admin/new" element={<PrivateRoute><SessionDetail /></PrivateRoute>} />
              <Route path="/admin/:id" element={<PrivateRoute><SessionDetail /></PrivateRoute>} />
              <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
              <Route path="/activities/:sessionId" element={<PrivateRoute><Activities /></PrivateRoute>} />
              <Route path="/activities/log/:logId" element={<PrivateRoute><LogDetail /></PrivateRoute>} />
              <Route path="/activities/backdate/:sessionId" element={<PrivateRoute><BackdateSession/></PrivateRoute>} />
              <Route path="/checkins" element={<PrivateRoute><CheckIns/></PrivateRoute>} />
              <Route path="/checkins/new" element={<PrivateRoute><NewCheckIn/></PrivateRoute>} />
              <Route path="/checkins/backdate" element={<PrivateRoute><BackdateCheckIn/></PrivateRoute>} />
              <Route path="/checkins/:checkinId/edit" element={<PrivateRoute><EditCheckIn/></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </section>
      </BrowserRouter>
    </AuthProvider>
  );
}
