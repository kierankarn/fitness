// src/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import { auth, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
export const AuthContext = createContext();
const ALLOWED = [
  "kierankarnuk@gmail.com",
  "rosullivan934@gmail.com"
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => {
      if (u && ALLOWED.includes(u.email)) {
        setUser(u);
      } else {
        if (u) logout();            // kick out disallowed emails
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {loading ? <p>Loading…</p> : children}
    </AuthContext.Provider>
  );
}
