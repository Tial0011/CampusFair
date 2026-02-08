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
   SLUGIFY
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
   RENDER REGISTER UI
================================ */
function renderRegisterUI() {
  app.innerHTML = `
    <div class="auth-container">
      <h1>Create Your Store</h1>
      <p>Start selling on CampusFair</p>

      <form id="registerForm">

        <input
          type="text"
          id="sellerCode"
          placeholder="Seller Code (CF-001)"
          required
        />

        <p style="font-size:0.75rem;color:#64748b;margin-top:-6px">
          To get a seller code, contact <strong>+2347060577255</strong>
        </p>

        <input type="text" id="ownerName" placeholder="Your Full Name" required />
        <input type="text" id="storeName" placeholder="Store Name" required />

        <textarea
          id="storeDescription"
          placeholder="Describe your business (what you sell, quality, delivery, etc)"
          rows="4"
          required
        ></textarea>

        <input
          type="tel"
          id="phone"
          placeholder="WhatsApp Number (e.g. +2348012345678)"
          required
        />

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

    if (phone.length < 10) {
      errorMsg.textContent = "Enter a valid WhatsApp number";
      return;
    }

    try {
      /* ===============================
         STORE NAME CHECK
      ================================ */
      const taken = await isStoreNameTaken(storeName);
      if (taken) {
        errorMsg.textContent =
          "Store name already exists. Please choose another.";
        return;
      }

      /* ===============================
         VALIDATE SELLER CODE
      ================================ */
      const codeRef = doc(db, "meta", "sellerCode");
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        errorMsg.textContent = "Seller code system unavailable.";
        return;
      }

      const { currentCode } = codeSnap.data();

      if (sellerCode !== currentCode) {
        errorMsg.textContent = "Invalid seller code.";
        return;
      }

      /* ===============================
         CREATE AUTH ACCOUNT
      ================================ */
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      /* ===============================
         CREATE SLUG
      ================================ */
      const storeSlug = slugify(storeName);

      /* ===============================
         CREATE SELLER DOCUMENT
      ================================ */
      await setDoc(doc(db, "sellers", uid), {
        sellerCode,
        ownerName,
        storeName,
        storeNameLower: storeName.toLowerCase(),
        storeSlug, // ✅ permanent slug
        storeDescription,
        phone,
        email,
        createdAt: serverTimestamp(),
        productCount: 0,
        active: true,
      });

      console.log("Seller document created for UID:", uid);

      // Wait briefly to ensure data is committed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      window.location.replace("/seller/dashboard.html");
    } catch (err) {
      console.error("Registration error:", err);
      errorMsg.textContent =
        err.message || "Failed to create store. Try again.";
    }
  });
}

/* ===============================
   INIT
================================ */
function init() {
  renderRegisterUI();
  setupRegister();
}

init();
