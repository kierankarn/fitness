// src/components/SessionPicker.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function SessionPicker() {
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  useEffect(() => {
    const loadSessions = async () => {
      const q = query(
        collection(db, "sessions"),
        where("owner", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadSessions();
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      const q = query(
        collection(db, "logs"),
        where("owner", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadLogs();
  }, []);

  // Calculate start of current week (Monday)
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) to 6
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  return (
    <div>
      <h1>Activities</h1>
      <h2>Start a Session</h2>
      <ul className="activities">
        {sessions.map(s => {
          const countThisWeek = logs.filter(
            l => l.sessionRef === s.id && new Date(l.startedAt) >= weekStart
          ).length;
          const timesLeft = Math.max(s.repeat - countThisWeek, 0);
          return (
            <li key={s.id} className="activities__item">
              <Link className="activities__item-link" to={`/activities/${s.id}`}>
                <svg className="activities__item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/></svg>
                <h3 className="activities__item-name">Start {s.name}</h3>
                <small>{timesLeft} of {s.repeat} left this week</small>{" "}
              </Link>{" "}
            </li>
          );
        })}
      </ul>
        <hr/>
      <h2>Log Previous Session</h2>
      <ul className="activities">
        {sessions.map(s => {
          const countThisWeek = logs.filter(
            l => l.sessionRef === s.id && new Date(l.startedAt) >= weekStart
          ).length;
          const timesLeft = Math.max(s.repeat - countThisWeek, 0);
          return (
            <li key={s.id} className="activities__item">
              <Link className="activities__item-link" to={`/activities/backdate/${s.id}`} style={{ marginLeft: 8 }}>
                <h3 className="activities__item-name">Log Previous {s.name}</h3>
              </Link>
            </li>
          );
        })}
      </ul>
      <hr/>
      <h2>Activity Log</h2>
      <ul className="activities">
        {logs
          .sort((a, b) => b.startedAt - a.startedAt)
          .map(log => {
            const session = sessions.find(s => s.id === log.sessionRef);
            const name = session ? session.name : "Unknown Session";
            const duration = Math.round((log.endedAt - log.startedAt) / 60000);
            return (
              <li className="activities__item" key={log.id}>
                <Link className="activities__item-link" to={`/activities/log/${log.id}`}>
                  <h3 className="activities__item-name">{name}</h3> 
                  <small className="activities__item-duration">{duration} min{" "}</small>
                  <span>{new Date(log.startedAt).toLocaleDateString('en-gb',dateOptions)}</span>
                  <svg className="activities__item-view" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/></svg>
                </Link>
              </li>
            );
          })}
      </ul>

      {/* Removed the stray <Link> that was referencing `s.id` out of scope */}
    </div>
  );
}
