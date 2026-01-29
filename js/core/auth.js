// js/core/auth.js
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { app } from "./firebase.js";

export const auth = getAuth(app);
