import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import { auth } from "../core/auth.js";

// signup seller
export function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// login seller
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// logout seller
export function logout() {
  return signOut(auth);
}

// auth listener
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
