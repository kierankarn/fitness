// src/components/SessionForm.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../scss/components/_sessionForm.scss";

export default function SessionForm({ session, onSaved }) {
  const navigate = useNavigate();
  const isNew = !session;

  // Session metadata
  const [type, setType] = useState(session?.type || "gym");
  const [repeat, setRepeat] = useState(session?.repeat || 1);
  const [name, setName] = useState(session?.name || "");
  const [rest, setRest] = useState(session?.restPeriod || 60);

  // Exercises: each has name, youtubeId, and setsDetails array
  const [exercises, setExercises] = useState(
    session?.exercises?.map(ex => ({
      ...ex,
      setsDetails: ex.setsDetails || Array.from({ length: ex.setCount || 1 }, () => ({ minReps: 0, maxReps: 0, note: "" }))
    })) || []
  );

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Helpers
  const validate = () => {
    const errs = {};
    if (!type) errs.type = "Session type is required";
    if (!name.trim()) errs.name = "Session name is required";
    if (rest <= 0) errs.rest = "Rest must be positive";
    if (repeat <= 0) errs.repeat = "Repeat must be at least 1";

    if (exercises.length === 0) {
      errs.exercises = "Add at least one exercise";
    } else {
      exercises.forEach((ex, i) => {
        if (!ex.name.trim()) errs[`exName${i}`] = "Exercise name is required";
        ex.setsDetails.forEach((sd, j) => {
          if (sd.minReps <= 0) errs[`minReps${i}_${j}`] = "Min reps must be > 0";
          if (sd.maxReps <= 0) errs[`maxReps${i}_${j}`] = "Max reps must be > 0";
          if (sd.maxReps < sd.minReps) errs[`range${i}_${j}`] = "Max must be >= Min";
        });
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const data = { type, name, restPeriod: rest, repeat, exercises, owner: auth.currentUser.uid };
    try {
      if (isNew) {
        await addDoc(collection(db, "sessions"), data);
      } else {
        await updateDoc(doc(db, "sessions", session.id), data);
      }
      onSaved?.();
    } catch (err) {
      console.error(err);
      setErrors({ form: "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  // Exercise operations
  const addExercise = () => {
    setExercises([...exercises, { name: "", youtubeId: "", setCount: 1, setsDetails: [{ minReps: 0, maxReps: 0, note: "" }] }]);
  };

  const updateExerciseField = (idx, field, value) => {
    const exs = [...exercises];
    exs[idx] = { ...exs[idx], [field]: value };
    setExercises(exs);
  };

  const updateSetCount = (idx, count) => {
    const exs = [...exercises];
    const details = exs[idx].setsDetails.slice();
    // adjust length
    while (details.length < count) details.push({ minReps: 0, maxReps: 0, note: "" });
    while (details.length > count) details.pop();
    exs[idx].setsDetails = details;
    exs[idx].setCount = count;
    setExercises(exs);
  };

  const updateSetDetail = (exIdx, setIdx, field, value) => {
    const exs = [...exercises];
    const detail = { ...exs[exIdx].setsDetails[setIdx], [field]: value };
    exs[exIdx].setsDetails[setIdx] = detail;
    setExercises(exs);
  };

  return (
    <div className="session-form">
      {errors.form && <p className="error">{errors.form}</p>}
      <button className="button button-secondary-outline" onClick={() => navigate("/admin")} style={{ marginBottom: 16 }}>← Back</button>

      <div className="form-item">
        <label htmlFor="type">Session Type:</label>
        <select id="type" value={type} onChange={e => setType(e.target.value)}>
          <option value="gym">Gym Session</option>
        </select>
        {errors.type && <small className="error">{errors.type}</small>}
      </div>

      <div className="form-item">
        <label htmlFor="name">Session Name:</label>
        <input id="name" placeholder="Session Name" value={name} onChange={e => setName(e.target.value)} />
        {errors.name && <small className="error">{errors.name}</small>}
      </div>

      <div className="form-item">
        <label htmlFor="rest">Rest (sec):</label>
        <input id="rest" type="number" placeholder="Rest (sec)" value={rest} onChange={e => setRest(+e.target.value)} />
        {errors.rest && <small className="error">{errors.rest}</small>}
      </div>

      <div className="form-item">
        <label htmlFor="repeat">Repeat per week:</label>
        <input id="repeat" type="number" placeholder="Repeat per week" value={repeat} onChange={e => setRepeat(+e.target.value)} />
        {errors.repeat && <small className="error">{errors.repeat}</small>}
      </div>

      <button className="button button-outline" onClick={addExercise} style={{ margin: '16px 0' }}>Add Exercise</button>
      {errors.exercises && <small className="error">{errors.exercises}</small>}

      {exercises.map((ex, i) => (
        <div key={i} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 16 }}>
          <div className="form-item">
            <label htmlFor={`ex-name-${i}`}>Exercise Name:</label>
            <input id={`ex-name-${i}`} placeholder="Exercise Name" value={ex.name} onChange={e => updateExerciseField(i, 'name', e.target.value)} />
            {errors[`exName${i}`] && <small className="error">{errors[`exName${i}`]}</small>}
          </div>

          <div className="form-item">
            <label htmlFor={`ex-video-${i}`}>YouTube ID:</label>
            <input id={`ex-video-${i}`} placeholder="YouTube ID" value={ex.youtubeId} onChange={e => updateExerciseField(i, 'youtubeId', e.target.value)} />
          </div>

          <div className="form-item">
            <label htmlFor={`ex-sets-${i}`}>Sets:</label>
            <input id={`ex-sets-${i}`} type="number" value={ex.setCount || ex.setsDetails.length} onChange={e => updateSetCount(i, +e.target.value)} />
          </div>

          {ex.setsDetails.map((sd, j) => (
            <div className="session-form__sets" key={j}>
              <strong>Set {j+1}:</strong>
              <div className="form-item">
              <label htmlFor={`min-${i}-${j}`}>Min reps:</label>
              <input id={`min-${i}-${j}`} type="number" placeholder="Min reps" value={sd.minReps} onChange={e => updateSetDetail(i, j, 'minReps', +e.target.value)}  />
              </div>
              <div className="form-item">
              <label htmlFor={`max-${i}-${j}`}>Max reps:</label>
              <input id={`max-${i}-${j}`} type="number" placeholder="Max reps" value={sd.maxReps} onChange={e => updateSetDetail(i, j, 'maxReps', +e.target.value)} />
              </div>
              <div className="form-item session-form__sets-notes">
              <label htmlFor={`note-${i}-${j}`}>Note:</label>
              <input id={`note-${i}-${j}`} placeholder="Note" value={sd.note} onChange={e => updateSetDetail(i, j, 'note', e.target.value)} />
              </div>
              {errors[`minReps${i}_${j}`] && <small className="error">{errors[`minReps${i}_${j}`]}</small>}
              {errors[`maxReps${i}_${j}`] && <small className="error">{errors[`maxReps${i}_${j}`]}</small>}
              {errors[`range${i}_${j}`] && <small className="error">{errors[`range${i}_${j}`]}</small>}
            </div>
          ))}
        </div>
      ))}

      <button className="button" onClick={save} disabled={saving}>{isNew ? "Create" : "Update"}</button>
    </div>
  );
}
