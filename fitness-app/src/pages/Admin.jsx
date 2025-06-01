import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import SessionForm from "../components/SessionForm";  // ← import

export default function SessionsList() {
  const [sessions, setSessions] = useState([]);
  const [adding, setAdding] = useState(false);       // ← show/hide form
  const [theme, setTheme] = useState(() => {
    // Try to load from localStorage or default to light
    return localStorage.getItem("theme") || "light";
  });

  const loadSessions = async () => {
    const q = query(
      collection(db, "sessions"),
      where("owner", "==", auth.currentUser.uid)
    );
    const snap = await getDocs(q);
    setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this session forever?")) return;
    await deleteDoc(doc(db, "sessions", id));
    loadSessions();
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    document.body.classList.remove("light", "dark"); // Clear old
    document.body.classList.add(theme);              // Add new
  }, [theme]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Sessions</h1>
        <button onClick={toggleTheme} className="button button-outline-secondary">
          {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        </button>
      </div>

      {/* toggle the “new” form */}
      {!adding ? (
        <button className="button" onClick={() => setAdding(true)}>
          + Create New Session
        </button>
      ) : (
        <div style={{ border: "1px solid #ccc", padding: "1rem", margin: "1rem 0" }}>
          <h2>New Session</h2>
          <SessionForm
            session={null}
            onSaved={() => {
              loadSessions();    // refresh list
              setAdding(false);  // hide form
            }}
          />
          <button className="button button-outline" onClick={() => setAdding(false)} style={{ float:'right', transform:'translateY(-100%)' }}>
            Cancel
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {sessions.map((s) => (
          <li key={s.id} className="modal" style={{ margin: "1.6rem 0" }}>
              <h3>{s.name}</h3>
              <div className="button-container button-container__flex-between">
                <Link className="button button-small" to={`/admin/${s.id}`}>
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="button button-small button-outline"
                >
                  Delete
                </button>
              </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
