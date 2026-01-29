// js/core/firestore.js
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { app } from "./firebase.js";

export const db = getFirestore(app);
