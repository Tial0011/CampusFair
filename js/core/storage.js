// js/core/storage.js
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";
import { app } from "./firebase.js";

export const storage = getStorage(app);
