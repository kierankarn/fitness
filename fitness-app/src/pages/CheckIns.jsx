// src/pages/CheckIns.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../scss/pages/_checkins.scss";

// Helper to format a Date (or Firestore Timestamp) as "YYYY-MM-DD" in local time
function formatLocalYYYYMMDD(input) {
  const d = input.toDate ? input.toDate() : new Date(input);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  return `${Y}-${M}-${D}`;
}

export default function CheckIns() {
  const [checkins, setCheckins] = useState([]);

  // Load all check-ins once
  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "checkins"),
        where("owner", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date descending
      items.sort((a, b) => {
        // If date is a Firestore Timestamp
        const da = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dbd = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dbd - da;
      });
      setCheckins(items);
    })();
  }, []);

  // Compute this week's Monday (local) as "YYYY-MM-DD"
  const thisWeekMonday = (() => {
    const now = new Date();
    // JavaScript: getDay() 0=Sun ... 1=Mon
    const delta = (now.getDay() + 6) % 7; // days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - delta);
    return formatLocalYYYYMMDD(monday);
  })();

  // Check if there's already a check-in for this week's Monday
  const doneThisWeek = checkins.some(ci =>
    formatLocalYYYYMMDD(ci.date) === thisWeekMonday
  );

  // Format Monday for display
  const displayDate = new Date(`${thisWeekMonday}T00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", month: "short", day: "numeric" }
  );

  return (
    <div className="checkins">
      <h1>Weekly Check-Ins</h1>

      {/* Only show if we haven't logged this week's yet */}
      {!doneThisWeek && (
        <div className="modal">
          <p>
            Your check-in for <strong>{displayDate}</strong> is due.
          </p>
          <Link className="button" to="/checkins/new">
            Log This Week’s Check-In
          </Link>
        </div>
      )}
      <hr />
      {/* Always allow back-dating */}
      <div style={{ marginBottom: "2rem" }}>
        <Link className="button button-outline" to="/checkins/backdate">
          Log Past Check-In
        </Link>
      </div>

      <h2>Past Check-Ins</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {checkins.map(ci => (
          <li key={ci.id} className="modal checkins__modal">
            <h3>
              {new Date(
                ci.date.toDate ? ci.date.toDate() : ci.date
              ).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </h3>
            <div className="checkins__modal-meta">
              <p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M128 176a128 128 0 1 1 256 0 128 128 0 1 1 -256 0zM391.8 64C359.5 24.9 310.7 0 256 0S152.5 24.9 120.2 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-56.2 0zM296 224c0-10.6-4.1-20.2-10.9-27.4l33.6-78.3c3.5-8.1-.3-17.5-8.4-21s-17.5 .3-21 8.4L255.7 184c-22 .1-39.7 18-39.7 40c0 22.1 17.9 40 40 40s40-17.9 40-40z"/></svg>
                {ci.weight} KG
              </p>
              <p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>
                {ci.avgSleep} hrs/night
              </p>
              <p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M416 0C352.3 0 256 32 256 32l0 128c48 0 76 16 104 32s56 32 104 32c56.4 0 176-16 176-96S512 0 416 0zM128 96c0 35.3 28.7 64 64 64l32 0 0-128-32 0c-35.3 0-64 28.7-64 64zM288 512c96 0 224-48 224-128s-119.6-96-176-96c-48 0-76 16-104 32s-56 32-104 32l0 128s96.3 32 160 32zM0 416c0 35.3 28.7 64 64 64l32 0 0-128-32 0c-35.3 0-64 28.7-64 64z"/></svg>
                {ci.avgSteps} steps/day
              </p>
              <p>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M32 0C23.1 0 14.6 3.7 8.6 10.2S-.6 25.4 .1 34.3L28.9 437.7c3 41.9 37.8 74.3 79.8 74.3l166.6 0c42 0 76.8-32.4 79.8-74.3L383.9 34.3c.6-8.9-2.4-17.6-8.5-24.1S360.9 0 352 0L32 0zM73 156.5L66.4 64l251.3 0L311 156.5l-24.2 12.1c-19.4 9.7-42.2 9.7-61.6 0c-20.9-10.4-45.5-10.4-66.4 0c-19.4 9.7-42.2 9.7-61.6 0L73 156.5z"/></svg>
                {ci.waterIntake} L/day
              </p>
            </div>
            <Link
              className="button button-small button-outline"
              to={`/checkins/${ci.id}/edit`}
              style={{ marginLeft: 8 }}
            >
              ✎ Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
