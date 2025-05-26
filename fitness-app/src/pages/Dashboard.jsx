// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import "../scss/pages/_dashboard.scss";

export default function Dashboard() {
  const user = auth.currentUser;
  const [sessions, setSessions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [weekLogs, setWeekLogs] = useState([]);
  const [checkinDue, setCheckinDue] = useState(false);

  // Track time-range per metric
  const [ranges, setRanges] = useState({
    weight: "all",
    steps: "all",
    sleep: "all",
    water: "all",
    energy: "all"
  });

  // Compute start of current week (Monday)
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diffToMon);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  // Today's display string
  const todayString = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
    []
  );

  // Load session templates
  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "sessions"),
        where("owner", "==", user.uid)
      );
      const snap = await getDocs(q);
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, [user.uid]);

  // Load all check-ins, then derive weekLogs & checkinDue
  useEffect(() => {
    (async () => {
      const q = query(
        collection(db, "checkins"),
        where("owner", "==", user.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map((d) => d.data())
        .sort((a, b) => a.date - b.date);
      setCheckins(data);

      const thisWeek = data.filter((ci) => new Date(ci.date) >= weekStart);
      setWeekLogs(thisWeek);
      setCheckinDue(thisWeek.length === 0);
    })();
  }, [user.uid, weekStart]);

  // Compute outstanding sessions
  const outstanding = useMemo(
    () =>
      sessions
        .map((s) => {
          const done = weekLogs.filter((l) => l.sessionRef === s.id).length;
          const left = Math.max((s.repeat || 1) - done, 0);
          return { ...s, done, left };
        })
        .filter((s) => s.left > 0),
    [sessions, weekLogs]
  );

  // Prepare chart data with timestamp
  const chartData = useMemo(
    () =>
      checkins.map((ci) => ({
        timestamp: ci.date,
        date: new Date(ci.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric"
        }),
        weight: ci.weight,
        steps: ci.avgSteps,
        sleep: ci.avgSleep,
        water: ci.waterIntake,
        energy: ci.energyLevel
      })),
    [checkins]
  );

  // helper to get cutoff timestamp
  const getCutoff = (range) => {
    const now = Date.now();
    switch (range) {
      case "month":
        return now - 30 * 24 * 60 * 60 * 1000;
      case "quarter":
        return now - 90 * 24 * 60 * 60 * 1000;
      case "year":
        return now - 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  // Chart configurations
  const charts = [
    { key: "weight", label: "Weight", stroke: "#8884d8", domain: undefined },
    { key: "steps", label: "Steps", stroke: "#82ca9d", domain: undefined },
    { key: "sleep", label: "Sleep (hrs)", stroke: "#ffc658", domain: undefined },
    { key: "water", label: "Water (L/day)", stroke: "#ff7300", domain: undefined },
    {
      key: "energy",
      label: "Energy Level",
      stroke: "#4287f5",
      domain: [1, 5]
    }
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <h1 className="no-margin">
        Welcome {user.displayName || user.email}
      </h1>
      <p>{todayString}</p>

      {/* Inline Check-In Prompt */}
      {checkinDue && (
        <div className="modal dashboard__modal">
          <span className="no-margin">Your weekly check-in is due!</span>
          <Link
            className="button button-small button-secondary"
            to="/checkins/new"
          >
            Log Check-In
          </Link>
        </div>
      )}
      <hr />

      {/* Outstanding Activities */}
      <h2>Activities This Week</h2>
      {outstanding.length > 0 ? (
        <ul className="dashboard__activities">
          {outstanding.map((s) => (
            <li
              key={s.id}
              className="dashboard__activities-item activity"
            >
              <h3 className="activity__name">{s.name}</h3>
              <span className="activity__left">
                {s.left} of {s.repeat || 1} left{" "}
              </span>
              <Link
                className="button button-small activity__start"
                to={`/activities/${s.id}`}
              >
                Start Session
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>All sessions completed for this week!</p>
      )}
      <hr />

      {/* Trends Over Time */}
      <h2>Trends Over Time</h2>
      <div className="dashboard__charts">
        {charts.map(({ key, label, stroke, domain }) => {
          const range = ranges[key];
          const cutoff = getCutoff(range);
          const data = chartData.filter((d) => d.timestamp >= cutoff);

          return (
            <div key={key} className="dashboard__chart">
              <div className="dashboard__chart-header">
              <h4>{label}</h4>
              <div className="form-item">
              <select
                value={range}
                onChange={(e) =>
                  setRanges((r) => ({ ...r, [key]: e.target.value }))
                }
                style={{ marginBottom: "0.5rem" }}
              >
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
              </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid stroke="#eee" />
                  <XAxis dataKey="date" />
                  <YAxis domain={domain} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={key}
                    stroke={stroke}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
