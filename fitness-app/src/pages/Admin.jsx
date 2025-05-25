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

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div>
      <h1>My Sessions</h1>

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
          <button onClick={() => setAdding(false)} style={{ marginTop: "0.5rem" }}>
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
