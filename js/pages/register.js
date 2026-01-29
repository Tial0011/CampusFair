// js/pages/seller-register.js

import { auth, db } from "../core/firebase.js";

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp,
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
          placeholder="WhatsApp Number (e.g. 2348012345678)"
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
      // Create auth account
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const uid = cred.user.uid;

      // Create seller/store document
      await setDoc(doc(db, "sellers", uid), {
        ownerName,
        storeName,
        storeDescription,
        phone,
        email,
        createdAt: serverTimestamp(),
        productCount: 0,
        active: true,
      });

      window.location.href = "/seller/dashboard.html";
    } catch (err) {
      console.error(err);
      errorMsg.textContent = err.message;
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
