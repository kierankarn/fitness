// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqOY_rh1zCJZdHVZHMX3Q_LaYXoJS-qJI",
  authDomain: "fitness-418e2.firebaseapp.com",
  projectId: "fitness-418e2",
  databaseURL: "https://fitness-418e2-default-rtdb.europe-west1.firebasedatabase.app/",
  storageBucket: "fitness-418e2.firebasestorage.app",
  messagingSenderId: "549757106561",
  appId: "1:549757106561:web:4d94211dc1576216171080",
  measurementId: "G-SC3JEG0Z0T"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}
export function logout() {
  return signOut(auth);
}
