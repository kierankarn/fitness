// src/pages/EditCheckIn.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function EditCheckIn() {
  const { checkinId } = useParams();    // route: /checkins/:checkinId/edit
  const navigate = useNavigate();

  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [weeklyWin, setWeeklyWin] = useState("");
  const [avgSleep, setAvgSleep] = useState("");
  const [avgSteps, setAvgSteps] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);  // new
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const ref = doc(db, "checkins", checkinId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.error("Check-in not found");
        return navigate("/checkins");
      }
      const data = snap.data();
      setDate(new Date(data.date).toISOString().substr(0,10));
      setWeight(data.weight);
      setWeeklyWin(data.weeklyWin);
      setAvgSleep(data.avgSleep);
      setAvgSteps(data.avgSteps);
      setWaterIntake(data.waterIntake);
      setEnergyLevel(data.energyLevel ?? 3);
      setLoading(false);
    })();
  }, [checkinId, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const ts = new Date(`${date}T00:00`).getTime();
      const ref = doc(db, "checkins", checkinId);
      await updateDoc(ref, {
        date: ts,
        weight: Number(weight),
        weeklyWin,
        avgSleep: avgSleep,
        avgSteps: Number(avgSteps),
        waterIntake: Number(waterIntake),
        energyLevel              // update it
      });
      navigate("/checkins");
    } catch (err) {
      console.error("Error updating check-in:", err);
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1>Edit Check-In</h1>
      <Link className="button button-secondary button-small" to="/checkins">← Back to Check-Ins</Link>
      <hr />
      <div className="form-item">
      <label htmlFor="ci-date">Date:</label>
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
        Weight:</label>
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
      Energy Level: {energyLevel}    </label>
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
      {/* ... then Save button ... */}
      <button className="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Update Check-In"}
      </button>
    </div>
  );
}
