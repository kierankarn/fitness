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
  const params     = useParams();
  const sessionId  = propSessionId || params.sessionId;
  const navigate   = useNavigate();

  const [session, setSession]       = useState(null);
  const [entries, setEntries]       = useState([]);
  const [modalVideo, setModalVideo] = useState(null);

  // Track when the session actually started
  const [sessionStart, setSessionStart] = useState(() => {
    const s = Number(localStorage.getItem("sessionStart"));
    return s && !isNaN(s) ? s : Date.now();
  });
  useEffect(() => {
    localStorage.setItem("sessionStart", String(sessionStart));
  }, [sessionStart]);

  // Persistent rest timer
  const [restTarget, setRestTarget] = useState(() => {
    const t = Number(localStorage.getItem("restTarget"));
    return t && !isNaN(t) ? t : null;
  });
  const [restLeft, setRestLeft] = useState(() => {
    if (!restTarget) return 0;
    const secs = Math.ceil((restTarget - Date.now())/1000);
    return secs > 0 ? secs : 0;
  });
  useEffect(() => {
    if (!restTarget) return;
    const tick = () => {
      const secs = Math.ceil((restTarget - Date.now())/1000);
      if (secs <= 0) {
        setRestLeft(0);
        setRestTarget(null);
        localStorage.removeItem("restTarget");
      } else {
        setRestLeft(secs);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [restTarget]);

  // Edit-mode toggles per exercise
  const [editing, setEditing] = useState({});
  const toggleEdit = idx => setEditing(e => ({ ...e, [idx]: !e[idx] }));

  // Past-sets edit toggles per exercise
  const [showPast, setShowPast] = useState({});
  const togglePast = idx => setShowPast(p => ({ ...p, [idx]: !p[idx] }));

  const [showFeedback, setShowFeedback] = useState(false);
  const [quality, setQuality]           = useState(3);
  const [difficulty, setDifficulty]     = useState(3);
  const [notes, setNotes]               = useState("");
  const [saving, setSaving]             = useState(false);

  // Load session + templates + last log
  useEffect(() => {
    async function load() {
      if (!sessionId) { navigate("/activities", { replace: true }); return; }
      try {
        const snap = await getDoc(doc(db, "sessions", sessionId));
        if (!snap.exists()) return;
        const data = snap.data();
        setSession({ id: snap.id, ...data });
        localStorage.setItem("activeSession", sessionId);
        const template = data.exercises.flatMap((ex, exIdx) => {
          const sets = ex.setsDetails || Array.from({ length: ex.setCount||1 }, () => ({ minReps:0, maxReps:0, note:"" }));
          return sets.map((_, setIdx) => ({ exerciseIndex: exIdx, setIndex: setIdx, weight: 0, repsDone: 0, completed: false }));
        });
        setEntries(template);
        const logsSnap = await getDocs(query(collection(db, "logs"), where("sessionRef", "==", sessionId)));
        const userLogs = logsSnap.docs.map(d => d.data())
          .filter(l => l.owner === auth.currentUser.uid)
          .sort((a, b) => b.startedAt - a.startedAt);
        if (userLogs.length) {
          const last = userLogs[0];
          setEntries(template.map(e => {
            const prev = last.exercisesDone.find(x => x.exerciseIndex===e.exerciseIndex && x.setIndex===e.setIndex);
            return prev ? { ...e, weight: prev.weight, repsDone: prev.repsDone } : e;
          }));
        }
      } catch (err) { console.error(err); }
    }
    load();
    return () => { localStorage.removeItem("activeSession"); };
  }, [sessionId, navigate]);

  const handleEntryChange = (i, f, v) => {
    const n = [...entries];
    n[i][f] = v;
    setEntries(n);
  };
  const handleIncrement = (i, f) => {
    const n = [...entries];
    const c = Number(n[i][f]) || 0;
    n[i][f] = String(c + 1);
    setEntries(n);
  };
  const handleDecrement = (i, f) => {
    const n = [...entries];
    const c = Number(n[i][f]) || 0;
    n[i][f] = String(Math.max(0, c - 1));
    setEntries(n);
  };

  const startRest = () => {
    if (!session?.restPeriod) return;
    const t = Date.now() + session.restPeriod * 1000;
    setRestTarget(t);
    localStorage.setItem("restTarget", String(t));
  };
  const handleCompleteSet = i => { const n=[...entries]; n[i].completed=true; setEntries(n); startRest(); };

  const handleCancel = () => { localStorage.removeItem("activeSession"); localStorage.removeItem("sessionStart"); navigate("/activities"); };
  const handleFinish = () => setShowFeedback(true);

  const handleSubmitFeedback = async () => {
    setSaving(true);
    try {
      const now = Date.now();
      await addDoc(collection(db, "logs"), {
        owner: auth.currentUser.uid,
        sessionRef: sessionId,
        startedAt: sessionStart,
        endedAt: now,
        exercisesDone: entries.filter(e => e.completed).map(e => ({ exerciseIndex:e.exerciseIndex, setIndex:e.setIndex, weight:e.weight, repsDone:e.repsDone, timestamp: now })),
        feedback: { quality, difficulty, notes }
      });
      localStorage.removeItem("activeSession");
      localStorage.removeItem("sessionStart");
      navigate("/activities");
    } catch (err) { console.error(err); setSaving(false); }
  };

  if (!session) return <p>Loading…</p>;

  const progressTotal   = entries.length;
  const progressDone    = entries.filter(e => e.completed).length;
  const progressPercent = progressTotal ? (progressDone/progressTotal)*100 : 0;

  return (
    <div className="session-runner">
      <div className="progress">
        <div className="site__wrapper">
          <div className="progress__bar">
            <div className="progress__bar-inside" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
      <div className="site__wrapper">
        <h1>{session.name}</h1>

        {session.exercises.map((ex, exIdx) => {
          const exEnts = entries.filter(e => e.exerciseIndex === exIdx);
          const total  = exEnts.length;
          const done   = exEnts.filter(e => e.completed).length;
          const isComplete = done >= total;
          const isEditing  = editing[exIdx];
          const isPastOpen = showPast[exIdx];
          const currIdx = isComplete
            ? entries.indexOf(exEnts[total - 1])
            : entries.indexOf(exEnts[done]);
          const curr = entries[currIdx];

          return (
            <div
              key={exIdx}
              className={`modal session-runner__modal${isComplete ? ' session-runner__modal--complete' : ''}`}
            >
              <div className="session-runner__exercise">
                {ex.youtubeId && (
                  <div
                    className="session-runner__exercise-video"
                    onClick={() => setModalVideo(ex.youtubeId)}
                  >
                    <img
                      className="session-runner__exercise-video-img"
                      src={`https://img.youtube.com/vi/${ex.youtubeId}/default.jpg`}
                      alt={`Video demo for ${ex.name}`}
                      width={90}
                      height={60}
                    />
                  </div>
                )}
                <div className="session-runner__exercise-details">
                  <h2 className="no-margin">{ex.name}</h2>
                  <small className="session-runner__meta">
                    {isComplete ? (
                      <span>Set Completed</span>
                    ) : (
                      <>
                        Set <strong>{done + 1}/{total}</strong> | Target: <strong>{ex.setsDetails?.[done]?.minReps || 0}-{ex.setsDetails?.[done]?.maxReps || 0} reps</strong>
                        {ex.setsDetails?.[done]?.note ? ` | (${ex.setsDetails[done].note})` : ''}
                      </>
                    )}
                  </small>
                </div>
              </div>

              {/* Completed banner */}
              {isComplete && !isEditing && (
                <div className="session-runner__completed">
                  <span className="button button-disabled">All sets completed ✓</span>
                  <button
                    className="button button-outline-secondary"
                    onClick={() => toggleEdit(exIdx)}
                  >
                    Edit sets
                  </button>
                </div>
              )}

              {/* Edit past sets before completion */}
              {!isComplete && done > 0 && !isEditing && (
                <div className="session-runner__past-editor">
                  <button
                    className="button button-outline-secondary button-small"
                    onClick={() => togglePast(exIdx)}
                  >
                    {isPastOpen ? 'Hide' : 'Edit'}
                  </button>
                  {isPastOpen && exEnts.slice(0, done).map((e, si) => {
                    const idx2 = entries.indexOf(e);
                    return (
                      <div key={si} className="session-runner__container form-container">
                        <div className="form-item number-input">
                          <label htmlFor={`past-weight-${exIdx}-${si}`}>Weight:</label>
                          <div className="number-input__controls">
                            <button type="button" onClick={() => handleDecrement(idx2, 'weight')}>-</button>
                            <input
                              id={`past-weight-${exIdx}-${si}`}
                              type="number"
                              inputMode="numeric"
                              value={e.weight}
                              onChange={ev => handleEntryChange(idx2, 'weight', ev.target.value)}
                            />
                            <button type="button" onClick={() => handleIncrement(idx2, 'weight')}>+</button>
                          </div>
                        </div>
                        <div className="form-item number-input">
                          <label htmlFor={`past-reps-${exIdx}-${si}`}>Reps:</label>
                          <div className="number-input__controls">
                            <button type="button" onClick={() => handleDecrement(idx2, 'repsDone')}>-</button>
                            <input
                              id={`past-reps-${exIdx}-${si}`}
                              type="number"
                              inputMode="numeric"
                              value={e.repsDone}
                              onChange={ev => handleEntryChange(idx2, 'repsDone', ev.target.value)}
                            />
                            <button type="button" onClick={() => handleIncrement(idx2, 'repsDone')}>+</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Current set inputs */}
              {!isComplete && !isEditing && (
                <div className="session-runner__container form-container">
                  <div className="form-item number-input">
                    <label htmlFor={`weight-${currIdx}`}>Weight:</label>
                    <div className="number-input__controls">
                      <button type="button" onClick={() => handleDecrement(currIdx, 'weight')}>-</button>
                      <input
                        id={`weight-${currIdx}`}
                        type="number"
                        value={curr.weight}
                        onChange={e => handleEntryChange(currIdx, 'weight', e.target.value)}
                      />
                      <button type="button" onClick={() => handleIncrement(currIdx, 'weight')}>+</button>
                    </div>
                  </div>
                  <div className="form-item number-input">
                    <label htmlFor={`reps-${currIdx}`}>Reps:</label>
                    <div className="number-input__controls">
                      <button type="button" onClick={() => handleDecrement(currIdx, 'repsDone')}>-</button>
                      <input
                        id={`reps-${currIdx}`}
                        type="number"
                        value={curr.repsDone}
                        onChange={e => handleEntryChange(currIdx, 'repsDone', e.target.value)}
                      />
                      <button type="button" onClick={() => handleIncrement(currIdx, 'repsDone')}>+</button>
                    </div>
                  </div>
                  <button className="session-runner__button button button-small button-secondary" onClick={() => handleCompleteSet(currIdx)}>
                    Complete
                  </button>
                </div>
              )}

              {/* Full edit mode */}
              {isEditing && (
                <div className="session-runner__container form-container">
                  {exEnts.map((e, si) => {
                    const idx2 = entries.indexOf(e);
                    return (
                      <div key={si} className="form-item number-input">
                        <label htmlFor={`edit-weight-${exIdx}-${si}`}>Set {si+1} Weight:</label>
                        <div className="number-input__controls">
                          <button type="button" onClick={() => handleDecrement(idx2, 'weight')}>-</button>
                          <input
                            id={`edit-weight-${exIdx}-${si}`}
                            type="number"
                            value={e.weight}
                            onChange={ev => handleEntryChange(idx2, 'weight', ev.target.value)}
                          />
                          <button type="button" onClick={() => handleIncrement(idx2, 'weight')}>+</button>
                        </div>
                        <label htmlFor={`edit-reps-${exIdx}-${si}`}>Reps:</label>
                        <div className="number-input__controls">
                          <button type="button" onClick={() => handleDecrement(idx2, 'repsDone')}>-</button>
                          <input
                            id={`edit-reps-${exIdx}-${si}`}
                            type="number"
                            value={e.repsDone}
                            onChange={ev => handleEntryChange(idx2, 'repsDone', ev.target.value)}
                          />
                          <button type="button" onClick={() => handleIncrement(idx2, 'repsDone')}>+</button>
                        </div>
                        {!e.completed && (
                          <button className="button button-small button-secondary" onClick={() => handleCompleteSet(idx2)}>
                            Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button className="button button-outline-secondary" onClick={() => toggleEdit(exIdx)}>
                    Done editing
                  </button>
                </div>
              )}

            </div>
          );
        })}

        <div className="button-container session-runner__button-container">
          <button onClick={handleFinish} className="button">Finish Session</button>
          <button onClick={handleCancel} className="button button-outline-secondary button-cancel">Cancel Session</button>
        </div>

        {/* Rest timer */}
        {restTarget !== null && (
          <div className="rest-timer" style={{ position:'fixed', bottom:0, left:0, right:0, transform: restLeft?'translateY(0)':'translateY(100%)', transition:'transform .3s', boxShadow:'0 -2px 8px rgba(0,0,0,0.2)' }}>
            <div>
              {restLeft>0 ? `Rest: ${Math.floor(restLeft/60)}:${String(restLeft%60).padStart(2,'0')}` : 'Rest complete'}
            </div>
            <div style={{ background:'#eee', height:8, borderRadius:4, overflow:'hidden', marginTop:4 }}>
              <div style={{ width:`${((session.restPeriod-restLeft)/session.restPeriod)*100}%`, height:'100%', background:'var(--global-primary-colour)', transition:'width 1s linear' }} />
            </div>
          </div>
        )}
        {/* Feedback Modal */}
        {showFeedback && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal session-runner__popup-modal">
              <h3>Session Feedback</h3>
              <div className="form-item">
                <label>How well did it go? (1-5)</label>
                <input type="range" min={1} max={5} value={quality} onChange={e => setQuality(Number(e.target.value))} />
              </div>
              <div className="form-item">
                <label>How hard was it? (1-5)</label>
                <input type="range" min={1} max={5} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} />
              </div>
              <div className="form-item">
                <label>Notes:</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ height: 60 }} />
              </div>
              <div className="button-container button-container__flex-between" style={{ marginTop: 16, textAlign: 'right' }}>
                <button className="button button-outline-secondary" onClick={() => setShowFeedback(false)} style={{ marginRight: 8 }}>Cancel</button>
                <button className="button" onClick={handleSubmitFeedback} disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Video Lightbox */}
        {modalVideo && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 999, height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalVideo(null)}>
            <div style={{ width: '100%', maxWidth: 600, maxHeight: 400, height: '100%' }} onClick={e => e.stopPropagation()}>
              <iframe
                title="How To Video"
                src={`https://www.youtube.com/embed/${modalVideo}?autoplay=1`}
                frameBorder="0"
                style={{ aspectRatio: '16/9', width: '100%', height: '100%' }}
                allow="autoplay; encrypted-media; fullscreen"
              />
              <button onClick={() => setModalVideo(null)} style={{ marginTop: 16, backgroundColor: 'transparent', border: 'none', position: 'absolute', top: 0, right: 12, transform: 'scaleX(1.2)', cursor: 'pointer', fontSize: '2rem', outline: 'none', color: 'var(--global-primary-colour)' }}>×</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
