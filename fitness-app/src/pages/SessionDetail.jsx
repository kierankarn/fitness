// src/pages/SessionDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import SessionForm from "../components/SessionForm";

export default function SessionDetail() {
  const { id } = useParams();            // “new” or a session ID
  const isNew = id === "new";
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    if (!id) {
      navigate("/admin", { replace: true });
      return;
    }
    setLoading(true);
    getDoc(doc(db, "sessions", id))
      .then(snap => {
        if (snap.exists()) setSession({ id: snap.id, ...snap.data() });
        else navigate("/admin", { replace: true });
      })
      .catch(() => navigate("/admin", { replace: true }))
      .finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  if (loading) return <p>Loading…</p>;

  return (
    <SessionForm
      session={isNew ? null : session}
      onSaved={() => navigate("/admin")}
    />
  );
}
