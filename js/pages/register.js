import { auth, db } from "../core/firebase.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
================================ */
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("/seller/dashboard.html");
  }
});

/* ===============================
   SLUGIFY FUNCTION
================================ */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   CHECK STORE NAME UNIQUENESS
================================ */
async function isStoreNameTaken(storeName) {
  const q = query(
    collection(db, "sellers"),
    where("storeNameLower", "==", storeName.toLowerCase()),
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

/* ===============================
   UI
================================ */
function renderRegisterUI() {
  app.innerHTML = `
    <div class="auth-container">
      <h1>Create Your Store</h1>
      <p>Start selling on CampusFair</p>

      <form id="registerForm">
        <input type="text" id="sellerCode" placeholder="Seller Code (CF-001)" required />

        <p style="font-size:0.75rem;color:#64748b;margin-top:-6px">
          To get a seller code, contact <strong>+2347060577255</strong>
        </p>

        <input type="text" id="ownerName" placeholder="Your Full Name" required />
        <input type="text" id="storeName" placeholder="Store Name" required />

        <textarea
          id="storeDescription"
          placeholder="Describe your business"
          rows="4"
          required
        ></textarea>

        <input type="tel" id="phone" placeholder="WhatsApp Number" required />
        <input type="email" id="email" placeholder="Email address" required />
        <input type="password" id="password" placeholder="Password" required />

        <button type="submit">Create Store</button>
      </form>

      <p class="auth-footer">
        Already have a store?
        <a href="/seller/login.html">Login</a>
      </p>

      <p id="errorMsg" class="error"></p>
    </div>
  `;
}

/* ===============================
   REGISTER LOGIC
================================ */
function setupRegister() {
  const form = document.getElementById("registerForm");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const sellerCode = document.getElementById("sellerCode").value.trim();
    const ownerName = document.getElementById("ownerName").value.trim();
    const storeName = document.getElementById("storeName").value.trim();
    const storeDescription = document
      .getElementById("storeDescription")
      .value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!storeName || storeName.length < 3) {
      errorMsg.textContent = "Store name is too short";
      return;
    }

    try {
      /* ===============================
         CHECK STORE NAME
      ================================ */
      const taken = await isStoreNameTaken(storeName);
      if (taken) {
        errorMsg.textContent = "Store name already exists.";
        return;
      }

      /* ===============================
         VALIDATE SELLER CODE
      ================================ */
      const codeSnap = await getDoc(doc(db, "meta", "sellerCode"));

      if (!codeSnap.exists()) {
        errorMsg.textContent = "Seller code system unavailable.";
        return;
      }

      if (sellerCode !== codeSnap.data().currentCode) {
        errorMsg.textContent = "Invalid seller code.";
        return;
      }

      /* ===============================
         CREATE AUTH USER
      ================================ */
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      /* ===============================
         CREATE STORE SLUG
      ================================ */
      const storeSlug = slugify(storeName);

      /* ===============================
         SAVE SELLER
      ================================ */
      await setDoc(doc(db, "sellers", uid), {
        uid,
        sellerCode,
        ownerName,
        storeName,
        storeNameLower: storeName.toLowerCase(),
        storeSlug,
        storeDescription,
        phone,
        email,
        productCount: 0,
        active: true,
        createdAt: serverTimestamp(),
      });

      window.location.replace("/seller/dashboard.html");
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Failed to create store.";
    }
  });
}

/* ===============================
   INIT
================================ */
renderRegisterUI();
setupRegister();
