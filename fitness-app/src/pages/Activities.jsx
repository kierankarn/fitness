// src/pages/Activities.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import SessionPicker from "../components/SessionPicker";
import SessionRunner from "../components/SessionRunner";
import "../scss/pages/_activities.scss"

export default function Activities() {
  const { sessionId } = useParams();

 return sessionId
    ? <SessionRunner sessionId={sessionId} />
    : <SessionPicker />;

    
}
