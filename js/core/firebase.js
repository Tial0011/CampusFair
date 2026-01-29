/* ===============================
   FIREBASE CORE SETUP
   Campus Fair Project
================================ */

// Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";

// Firebase services
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

/* ===============================
   CONFIG
================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDLkY0_-IZfFfTTb0iP3YgPgf7Ua-uGF6s",
  authDomain: "campus-fair.firebaseapp.com",
  projectId: "campus-fair",
  storageBucket: "campus-fair.firebasestorage.app",
  messagingSenderId: "917882662022",
  appId: "1:917882662022:web:07178acffc92d397fab507",
  measurementId: "G-9PQY4JN6YF",
};

/* ===============================
   INIT
================================ */

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

/* ===============================
   EXPORTS
================================ */

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
