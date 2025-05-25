// src/components/SessionRunner.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import "../scss/components/_sessionRunner.scss";

export default function SessionRunner({ sessionId: propSessionId }) {
  const params = useParams();
  const sessionId = propSessionId || params.sessionId;
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [entries, setEntries] = useState([]);
  const [modalVideo, setModalVideo] = useState(null);
  const [restLeft, setRestLeft] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quality, setQuality] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!sessionId) {
        navigate("/activities", { replace: true });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "sessions", sessionId));
        if (!snap.exists()) return;
        const data = snap.data();
        setSession({ id: snap.id, ...data });
        localStorage.setItem("activeSession", sessionId);

        // prepare template entries
        const templateEntries = data.exercises.flatMap((ex, exIndex) => {
          const sets = ex.setsDetails ||
            Array.from({ length: ex.setCount || 1 }, () => ({ minReps: 0, maxReps: 0, note: "" }));
          return sets.map((_, setIndex) => ({
            exerciseIndex: exIndex,
            setIndex,
            weight: 0,
            repsDone: 0,
            completed: false
          }));
        });
        setEntries(templateEntries);

        // prefill previous log
        const allLogsSnap = await getDocs(query(
          collection(db, "logs"), where("sessionRef", "==", sessionId)
        ));
        const userLogs = allLogsSnap.docs.map(d => d.data())
          .filter(l => l.owner === auth.currentUser.uid)
          .sort((a, b) => b.startedAt - a.startedAt);
        if (userLogs.length) {
          const lastLog = userLogs[0];
          setEntries(templateEntries.map(e => {
            const prev = lastLog.exercisesDone.find(
              x => x.exerciseIndex === e.exerciseIndex && x.setIndex === e.setIndex
            );
            return prev ? { ...e, weight: prev.weight, repsDone: prev.repsDone } : e;
          }));
        }
      } catch (err) {
        console.error("Error loading session:", err);
      }
    }
    load();
    return () => {
      localStorage.removeItem("activeSession");
    };
  }, [sessionId, navigate]);

  // countdown
  useEffect(() => {
    if (restLeft <= 0) return;
    const timer = setTimeout(() => setRestLeft(restLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [restLeft]);

  const handleEntryChange = (idx, field, value) => {
    const next = [...entries];
    next[idx][field] = value;  // store as string to allow empty
    setEntries(next);
  };

  const handleIncrement = (idx, field) => {
    const next = [...entries];
    const current = Number(next[idx][field]) || 0;
    next[idx][field] = String(current + 1);
    setEntries(next);
  };

  const handleDecrement = (idx, field) => {
    const next = [...entries];
    const current = Number(next[idx][field]) || 0;
    next[idx][field] = String(Math.max(0, current - 1));
    setEntries(next);
  };

  const handleCompleteSet = (idx) => {
    const next = [...entries];
    next[idx].completed = true;
    setEntries(next);
    if (session.restPeriod) setRestLeft(session.restPeriod);
  };

  const handleCancel = () => {
    localStorage.removeItem("activeSession");
    navigate("/activities");
  };

  const handleFinish = () => {
    setShowFeedback(true);
  };

  const handleSubmitFeedback = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      const doneSets = entries.filter(e => e.completed);
      await addDoc(collection(db, "logs"), {
        owner: auth.currentUser.uid,
        sessionRef: sessionId,
        startedAt: now,
        endedAt: now,
        exercisesDone: doneSets.map(e => ({
          exerciseIndex: e.exerciseIndex,
          setIndex: e.setIndex,
          weight: e.weight,
          repsDone: e.repsDone,
          timestamp: now
        })),
        feedback: { quality, difficulty, notes }
      });
      localStorage.removeItem("activeSession");
      navigate("/activities");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (!session) return <p>Loading…</p>;

  // find current entry per exercise
  const progressTotal = entries.length;
  const progressDone = entries.filter(e => e.completed).length;
  const progressPercent = progressTotal ? (progressDone/progressTotal)*100 : 0;

  return (
    <div className="session-runner">
      <div className="progress">
        <div class="site__wrapper">
          <div className="progress__bar">
            <div className="progress__bar-inside" style={{ width: `${progressPercent}%`}} />
          </div>
        </div>
      </div>
      <div className="site__wrapper">
      <h1>{session.name}</h1>

      {session.exercises.map((ex, exIndex) => {
        const exEntries = entries.filter(e => e.exerciseIndex===exIndex);
        const total = exEntries.length;
        const done = exEntries.filter(e=>e.completed).length;
        const idx = done < total ? entries.indexOf(exEntries[done]) : entries.indexOf(exEntries[total-1]);
        const entry = entries[idx];
        const { minReps, maxReps, note } = ex.setsDetails?.[entry.setIndex]||{};

        return (
          <div key={exIndex} className="modal session-runner__modal">
            <h2 className="no-margin">{ex.name}</h2>
            <small class="session-runner__meta">Set <strong>{done+1}/{total}</strong> | Target: <strong>{minReps}-{maxReps} reps</strong> {note && `| (${note})`}</small>
            <div className="session-runner__container form-container">
              <div className="form-item number-input">
                <label htmlFor={`weight-${idx}`}>Weight:</label>
                <div className="number-input__controls">
                  <button type="button" onClick={() => handleDecrement(idx, 'weight')}>-</button>
                  <input
                    id={`weight-${idx}`} 
                    type="number" 
                    value={entry.weight} 
                    onChange={e => handleEntryChange(idx, 'weight', e.target.value)}
                  />
                  <button type="button" onClick={() => handleIncrement(idx, 'weight')}>+</button>
                </div>
              </div>
              <div className="form-item number-input">
                <label htmlFor={`reps-${idx}`}>Reps:</label>
                <div className="number-input__controls">
                  <button type="button" onClick={() => handleDecrement(idx, 'repsDone')}>-</button>
                  <input
                    id={`reps-${idx}`} 
                    type="number" 
                    value={entry.repsDone} 
                    onChange={e => handleEntryChange(idx, 'repsDone', e.target.value)}
                  />
                  <button type="button" onClick={() => handleIncrement(idx, 'repsDone')}>+</button>
                </div>
              </div>
              {!entry.completed && <button className="session-runner__button button button-small button-secondary " onClick={()=>handleCompleteSet(idx)}>Complete</button>}
            </div>
          </div>
        );
      })}
      <div class="button-container session-runner__button-container">
        <button onClick={handleFinish} className="button">Finish Session</button>
        <button onClick={handleCancel} className="button button-outline-secondary button-cancel">Cancel Session</button>
      </div>
      

      {/* Rest sheet */}
      <div className="rest-timer" style={{ position:'fixed', bottom:0, left:0, right:0, transform:restLeft? 'translateY(0)':'translateY(100%)', transition:'transform .3s', boxShadow:'0 -2px 8px rgba(0,0,0,0.2)' }}>
        <div>Rest: {`${Math.floor(restLeft/60)}:${(restLeft%60).toString().padStart(2,'0')}`}</div>
        <div style={{ background:'#eee', height:8, borderRadius:4, overflow:'hidden', marginTop:4 }}>
          <div style={{ width:`${((session.restPeriod-restLeft)/session.restPeriod)*100}%`, height:'100%', background:'var(--global-primary-colour)', transition:'width 1s linear' }} />
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div style={{ position:'fixed', top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.6)', display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="modal session-runner__popup-modal">
            <h3>Session Feedback</h3>
            <div class="form-item">
              <label>How well did it go? (1-5)</label>
                <input type="range" min={1} max={5} value={quality} onChange={e=>setQuality(Number(e.target.value))} />
            </div>
            <div class="form-item">
              <label>How hard was it? (1-5)</label>
              <input type="range" min={1} max={5} value={difficulty} onChange={e=>setDifficulty(Number(e.target.value))} />
            </div>
            <div class="form-item">
              <label>Notes:</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} style={{height:60 }} />
            </div>
            <div className="button-container button-container__flex-between" style={{ marginTop:16, textAlign:'right' }}>
              <button className="button button-outline-secondary" onClick={()=>setShowFeedback(false)} style={{ marginRight:8 }}>Cancel</button>
              <button className="button" onClick={handleSubmitFeedback} disabled={saving}>{saving? 'Saving...':'Submit'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Lightbox */}
      {modalVideo && (
        <div style={{ position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center' }} onClick={()=>setModalVideo(null)}>
          <div onClick={e=>e.stopPropagation()}>
            <iframe title="How To Video" width="560" height="315" src={`https://www.youtube.com/embed/${modalVideo}`} frameBorder="0" allowFullScreen />
            <button onClick={()=>setModalVideo(null)} style={{ marginTop:16 }}>Close</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
