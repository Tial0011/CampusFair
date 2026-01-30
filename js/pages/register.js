// js/pages/seller-register.js

import { auth, db } from "../core/firebase.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

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
          placeholder="Seller Code (e.g. CF-001)"
          required
        />

        <p class="hint">
          To get a seller code, contact <strong>+2347060577255</strong>
        </p>

        <input
          type="text"
          id="ownerName"
          placeholder="Your Full Name"
          required
        />

        <input
          type="text"
          id="storeName"
          placeholder="Store Name"
          required
        />

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

        <input
          type="email"
          id="email"
          placeholder="Email address"
          required
        />

        <input
          type="password"
          id="password"
          placeholder="Password"
          required
        />

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
      /* 1️⃣ Get current seller code */
      const codeRef = doc(db, "meta", "sellerCode");
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        errorMsg.textContent = "Seller code system not available.";
        return;
      }

      const { currentCode, currentNumber } = codeSnap.data();

      /* 2️⃣ Validate seller code */
      if (sellerCode !== currentCode) {
        errorMsg.textContent = "Invalid or already used seller code.";
        return;
      }

      /* 3️⃣ Create auth account */
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const uid = cred.user.uid;

      /* 4️⃣ Create seller document */
      await setDoc(doc(db, "sellers", uid), {
        ownerName,
        storeName,
        storeDescription,
        phone,
        email,
        sellerCode: currentCode,
        createdAt: serverTimestamp(),
        productCount: 0,
        active: true,
      });

      /* 5️⃣ Increment seller code */
      const nextNumber = currentNumber + 1;
      const nextCode = `CF-${String(nextNumber).padStart(3, "0")}`;

      await updateDoc(codeRef, {
        currentNumber: nextNumber,
        currentCode: nextCode,
      });

      window.location.href = "/seller/dashboard.html";
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Registration failed. Try again.";
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
