// js/pages/seller-login.js

import { auth } from "../core/firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
   - If already logged in → dashboard
================================ */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 🔒 prevent going back to login
    window.location.replace("/seller/dashboard.html");
  }
});

/* ===============================
   RENDER LOGIN UI
================================ */
function renderLoginUI() {
  app.innerHTML = `
    <div class="auth-container">
      <h1>Seller Login</h1>
      <p>Login to manage your CampusFair store</p>

      <form id="loginForm">
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

        <button type="submit">Login</button>
      </form>

      <p class="auth-footer">
        Don’t have a store?
        <a href="/seller/register.html">Create one</a>
      </p>

      <p id="errorMsg" class="error"></p>
    </div>
  `;
}

/* ===============================
   LOGIN LOGIC
================================ */
function setupLogin() {
  const form = document.getElementById("loginForm");
  const errorMsg = document.getElementById("errorMsg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // 🔥 replace history so BACK goes to home
      window.location.replace("/seller/dashboard.html");
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Invalid email or password";
    }
  });
}

/* ===============================
   INIT
================================ */
function init() {
  renderLoginUI();
  setupLogin();
}

init();
