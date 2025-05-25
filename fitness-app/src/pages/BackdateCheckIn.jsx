// src/pages/BackdateCheckIn.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function BackdateCheckIn() {
  const navigate = useNavigate();

  const [date, setDate] = useState(() =>
    new Date().toISOString().substr(0, 10)
  );
  const [weight, setWeight] = useState("");
  const [weeklyWin, setWeeklyWin] = useState("");
  const [avgSleep, setAvgSleep] = useState("");
  const [avgSteps, setAvgSteps] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [saving, setSaving] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(3)

  const handleSave = async () => {
    setSaving(true);
    try {
      const ts = new Date(`${date}T00:00`).getTime();
      await addDoc(collection(db, "checkins"), {
        owner: auth.currentUser.uid,
        date: ts,
        weight: Number(weight),
        weeklyWin,
        avgSleep: avgSleep,
        avgSteps: Number(avgSteps),
        waterIntake: Number(waterIntake),
        energyLevel,
      });
      navigate("/checkins");
    } catch (err) {
      console.error("Error saving back-dated check-in:", err);
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/checkins" className="button button-secondary button-small">
        ← Back to Check-Ins
      </Link>
      <div className="spacer" style={{height:24}}></div>
      <h1>Log Past Check-In</h1>

      <hr/>

      <div className="form-item">
      <label htmlFor="ci-date">
        Date:</label>
        <input
          type="date"
          id="ci-date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ display: "block", margin: "0.5rem 0" }}
        />
      </div>

      <div className="form-item">
      <label htmlFor="ci-weight">
        Weight (KG):</label>
        <input
          type="number"
          id="ci-weight"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="e.g. 72.5"
          style={{ display: "block", margin: "0.25rem 0" }}
        />
      </div>
      <div className="form-item">
      <label htmlFor="ci-win">
        Weekly Win:</label>
        <textarea
          id="ci-win"
          value={weeklyWin}
          onChange={e => setWeeklyWin(e.target.value)}
          placeholder="What went well?"
          style={{ display: "block", margin: "0.25rem 0" }}
        />
      </div>

      <div className="form-item">
      <label htmlFor="ci-sleep">
        Avg. Sleep (hrs):</label>
        <input
          type="text"
          id="ci-sleep"
          value={avgSleep}
          onChange={e => setAvgSleep(e.target.value)}
          placeholder="e.g. 7.8"
          style={{ display: "block", margin: "0.25rem 0" }}
        />
      </div>

      <div className="form-item">
      <label htmlFor="ci-steps">
        Avg. Steps:</label>
        <input
          type="number"
          id="ci-steps"
          value={avgSteps}
          onChange={e => setAvgSteps(e.target.value)}
          placeholder="e.g. 8500"
          style={{ display: "block", margin: "0.25rem 0" }}
        />
      </div>

      <div className="form-item">
      <label htmlFor="ci-water">
        Water Intake (L/day):</label>
        <input
          type="number"
          id="ci-water"
          value={waterIntake}
          onChange={e => setWaterIntake(e.target.value)}
          placeholder="e.g. 2.5"
          style={{ display: "block", margin: "0.25rem 0" }}
        />
      </div>
      <div className="form-item">
          <label htmlFor="ci-energy">
      Energy Level: {energyLevel}</label>
      <input
        type="range"
        id="ci-energy"
        min={1}
        max={5}
        value={energyLevel}
        onChange={e => setEnergyLevel(Number(e.target.value))}
        style={{ display: "block", margin: "0.5rem 0" }}
      />
    </div>
    <div className="spacer" style={{height:24}}></div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="button"
      >
        {saving ? "Saving…" : "Save Past Check-In"}
      </button>


    </div>
  );
}
