// src/pages/BackdateSession.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import "../scss/components/_sessionRunner.scss";

export default function BackdateSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [logDate, setLogDate] = useState(() =>
    new Date().toISOString().substr(0, 10)
  );
  const [entries, setEntries] = useState([]);
  const [duration, setDuration] = useState("");
  const [quality, setQuality] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load session template & initialize entries
  useEffect(() => {
    async function load() {
      if (!sessionId) return navigate("/activities", { replace: true });
      const snap = await getDoc(doc(db, "sessions", sessionId));
      if (!snap.exists()) return navigate("/activities", { replace: true });
      const data = snap.data();
      setSession({ id: snap.id, ...data });

      // one entry per set
      const inits = data.exercises.flatMap((ex, exIndex) =>
        (ex.setsDetails || Array(ex.setCount).fill()).map((_, setIndex) => ({
          exerciseIndex: exIndex,
          setIndex,
          weight: "",
          repsDone: ""
        }))
      );
      setEntries(inits);
    }
    load();
  }, [sessionId, navigate]);

  const handleChange = (idx, field, value) =>
    setEntries(prev => {
      const all = [...prev];
      all[idx] = { ...all[idx], [field]: value };
      return all;
    });

  const handleIncrementEntry = (idx, field) => {
    setEntries(prev => {
      const all = [...prev];
      const current = Number(all[idx][field]) || 0;
      all[idx][field] = String(current + 1);
      return all;
    });
  };

  const handleDecrementEntry = (idx, field) => {
    setEntries(prev => {
      const all = [...prev];
      const current = Number(all[idx][field]) || 0;
      all[idx][field] = String(Math.max(0, current - 1));
      return all;
    });
  };

  const handleIncrementDuration = () => {
    const current = Number(duration) || 0;
    setDuration(String(current + 1));
  };

  const handleDecrementDuration = () => {
    const current = Number(duration) || 0;
    setDuration(String(Math.max(0, current - 1)));
  };

  const validate = () => {
    const errs = {};
    if (!duration || Number(duration) <= 0) {
      errs.duration = "Please enter a positive duration (minutes)";
    }
    if (quality < 1 || quality > 5) {
      errs.quality = "Quality must be between 1 and 5";
    }
    if (difficulty < 1 || difficulty > 5) {
      errs.difficulty = "Difficulty must be between 1 and 5";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!session) return;
    if (!validate()) return;
    setSaving(true);

    const ts = new Date(`${logDate}T00:00`).getTime();
    const durationMs = Number(duration) * 60000;
    const exercisesDone = entries
      .filter(e => e.weight || e.repsDone)
      .map(e => ({
        exerciseIndex: e.exerciseIndex,
        setIndex: e.setIndex,
        weight: Number(e.weight) || 0,
        repsDone: Number(e.repsDone) || 0,
        timestamp: ts
      }));

    try {
      await addDoc(collection(db, "logs"), {
        owner: auth.currentUser.uid,
        sessionRef: sessionId,
        startedAt: ts,
        endedAt: ts + durationMs,
        exercisesDone,
        feedback: {
          quality,
          difficulty,
          notes
        }
      });
      navigate("/activities");
    } catch (err) {
      console.error("Error saving log:", err);
      setSaving(false);
    }
  };

  if (!session) return <p>Loading…</p>;

  return (
    <div>
      <h1>Log Past Session: {session.name}</h1>
      <Link className="button button-small button-secondary" to="/activities">
        ← Back to Activities
      </Link>
      <hr />

      {/* Date Picker */}
      <div className="form-item">
        <label htmlFor="backdate">Date of Workout:</label>
        <input
          type="date"
          id="backdate"
          value={logDate}
          onChange={e => setLogDate(e.target.value)}
          style={{ display: "block", margin: "0.5rem 0" }}
        />
      </div>

      {/* Duration with +/- controls */}
      <div className="form-item number-input">
        <label htmlFor="duration">Session Duration (minutes):</label>
        <div className="number-input__controls" style={{ display: "flex", alignItems: "center", margin: "0.5rem 0" }}>
          <button type="button" onClick={handleDecrementDuration}>-</button>
          <input
            id="duration"
            type="number"
            inputMode="decimal"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="e.g. 45"
            style={{ margin: "0 1rem" }}
          />
          <button type="button" onClick={handleIncrementDuration}>+</button>
        </div>
        {errors.duration && (
          <small className="error" style={{ color: "red" }}>
            {errors.duration}
          </small>
        )}
      </div>

      {/* Feedback Section */}
      <fieldset style={{ margin: "1rem 0", padding: "1rem", border: "1px solid #ccc" }}>
        <legend>Session Feedback</legend>
        <div className="form-item">
          <label htmlFor="quality">How well did it go? (1–5):</label>
          <input
            type="range"
            id="quality"
            min={1}
            max={5}
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            style={{ margin: "0.25rem 0", display: "block" }}
          />
        </div>
        {errors.quality && (
          <small className="error" style={{ color: "red" }}>
            {errors.quality}
          </small>
        )}
        <div className="form-item">
          <label htmlFor="difficulty">How hard was it? (1–5):</label>
          <input
            type="range"
            id="difficulty"
            min={1}
            max={5}
            value={difficulty}
            onChange={e => setDifficulty(Number(e.target.value))}
            style={{ margin: "0.25rem 0", display: "block" }}
          />
        </div>
        {errors.difficulty && (
          <small className="error" style={{ color: "red" }}>
            {errors.difficulty}
          </small>
        )}
        <div className="form-item">
          <label htmlFor="notes">Notes:</label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anything to remember?"
            style={{ display: "block", margin: "0.25rem 0", width: "100%", height: 60 }}
          />
        </div>
      </fieldset>

      {/* Exercises Inputs */}
      {session.exercises.map((ex, exIdx) => (
        <fieldset key={exIdx} style={{ margin: "1rem 0" }}>
          <legend>
            <strong>{ex.name}</strong>
          </legend>
          {(ex.setsDetails || Array(ex.setCount).fill()).map((sd, setIdx) => {
            const globalIdx = entries.findIndex(
              x => x.exerciseIndex === exIdx && x.setIndex === setIdx
            );
            return (
              <div key={setIdx} style={{ marginBottom: "0.5rem" }}>
                <label>
                  Set {setIdx + 1} Target:{' '}
                  {sd
                    ? `${sd.minReps}-${sd.maxReps}${sd.note ? ` (${sd.note})` : ""} reps`
                    : `${ex.setCount || 1} reps`}
                </label>
                <div className="form-item number-input">
                  {/* Weight input with +/- */}
                  <div className="number-input">
                    <label htmlFor={`w-${globalIdx}`}>Weight:</label>
                    <div className="number-input__controls" style={{ display: "flex", alignItems: "center", marginLeft: "0.5rem" }}>
                      <button type="button" onClick={() => handleDecrementEntry(globalIdx, 'weight')}>-</button>
                      <input
                        id={`w-${globalIdx}`}
                        type="number"
                        inputMode="decimal"
                        value={entries[globalIdx]?.weight}
                        onChange={e => handleChange(globalIdx, 'weight', e.target.value)}
                        style={{ margin: "0 0.5rem" }}
                      />
                      <button type="button" onClick={() => handleIncrementEntry(globalIdx, 'weight')}>+</button>
                    </div>
                  </div>
                  {/* Reps input with +/- */}
                  <div className="form-item number-input " >
                    <label htmlFor={`r-${globalIdx}`}>Reps:</label>
                    <div className="number-input__controls" style={{ display: "flex", alignItems: "center", marginLeft: "0.5rem" }}>
                      <button type="button" onClick={() => handleDecrementEntry(globalIdx, 'repsDone')}>-</button>
                      <input
                        id={`r-${globalIdx}`}
                        type="number"
                        inputMode="decimal"
                        value={entries[globalIdx]?.repsDone}
                        onChange={e => handleChange(globalIdx, 'repsDone', e.target.value)}
                        style={{ margin: "0 0.5rem" }}
                      />
                      <button type="button" onClick={() => handleIncrementEntry(globalIdx, 'repsDone')}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </fieldset>
      ))}

      <button className="button" onClick={handleSave} disabled={saving} style={{ marginTop: "1rem" }}>
        {saving ? "Saving…" : "Save Past Workout"}
      </button>
    </div>
  );
}
