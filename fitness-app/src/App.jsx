// src/App.jsx
import React, { useContext } from "react";
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
  return (
    <AuthProvider>
      <BrowserRouter>
        <HeaderWrapper />
        <section class="site-main">
          <div class="site__wrapper">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <SessionsList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/new"
                element={
                  <PrivateRoute>
                    <SessionDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/:id"
                element={
                  <PrivateRoute>
                    <SessionDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <PrivateRoute>
                    <Activities />
                  </PrivateRoute>
                }
              />
              <Route
                path="/activities/:sessionId"
                element={
                  <PrivateRoute>
                    <Activities />
                  </PrivateRoute>
                }
              />
              <Route
                path="/activities/log/:logId"
                element={
                  <PrivateRoute>
                    <LogDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/activities/backdate/:sessionId"
                element={
                  <PrivateRoute>
                    <BackdateSession/>
                  </PrivateRoute>
                }
              />
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
