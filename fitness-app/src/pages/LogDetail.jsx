// src/pages/LogDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

export default function LogDetail() {
  const { logId } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load log data
        const logRef = doc(db, "logs", logId);
        const logSnap = await getDoc(logRef);
        if (!logSnap.exists()) {
          console.error("Log not found");
          navigate("/activities", { replace: true });
          return;
        }
        const logData = { id: logSnap.id, ...logSnap.data() };
        setLog(logData);
        setEntries(logData.exercisesDone);

        // Load session template to get exercise names
        const sessionRef = doc(db, "sessions", logData.sessionRef);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
          setSession({ id: sessionSnap.id, ...sessionSnap.data() });
        }
      } catch (err) {
        console.error(err);
        navigate("/activities", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [logId, navigate]);

  const handleChange = (index, field, value) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const validate = () => {
    const errs = {};
    entries.forEach((e, i) => {
      if (e.weight <= 0) errs[`weight${i}`] = "Weight must be positive";
      if (e.repsDone <= 0) errs[`reps${i}`] = "Reps must be positive";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const logRef = doc(db, "logs", logId);
      await updateDoc(logRef, { exercisesDone: entries });
      navigate("/activities");
    } catch (err) {
      console.error(err);
      setErrors({ form: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      const logRef = doc(db, "logs", logId);
      await deleteDoc(logRef);
      navigate("/activities");
    } catch (err) {
      console.error("Failed to delete log:", err);
      alert("Could not delete log. Please try again.");
    }
  };

  if (loading) return <p>Loading…</p>;
  if (!log || !session) return <p>Log or session data unavailable.</p>;

  return (
    <div>
      <h1>Log Details</h1>
      <div className="button-container button-container__flex-between">
        <Link className="button button-small button-secondary" to="/activities">← Back to Activities</Link>
        <button
          onClick={handleDelete}
          className="button button-small button-outline-secondary"
          style={{
            cursor: "pointer"
          }}
        >
          Delete Log
        </button>
      </div>
      <hr />
      {errors.form && <p className="error">{errors.form}</p>}

      <h2>{session.name}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {entries.map((e, i) => {
          const ex = session.exercises[e.exerciseIndex] || {};
          const date = new Date(e.timestamp).toLocaleString();
          return (
            <li className="modal" key={i} style={{ margin: '1rem 0' }}>
              <strong>{ex.name || 'Exercise'}</strong> ({date})
              <div className="form-item">
                <label>Weight:{" "}</label>
                  <input
                    type="number"
                    value={e.weight}
                    onChange={ev => handleChange(i, 'weight', Number(ev.target.value))}
                  />
                
                {errors[`weight${i}`] && <small className="error">{errors[`weight${i}`]}</small>}
              </div>
              <div className="form-item">
                <label>Reps:{" "}</label>
                  <input
                    type="number"
                    value={e.repsDone}
                    onChange={ev => handleChange(i, 'repsDone', Number(ev.target.value))}
                  />
    
                {errors[`reps${i}`] && <small className="error">{errors[`reps${i}`]}</small>}
              </div>
            </li>
          );
        })}
      </ul>

      <button className="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
