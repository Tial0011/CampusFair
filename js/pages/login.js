// js/pages/seller-login.js

import { auth } from "../core/firebase.js";

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const app = document.getElementById("app");

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

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    errorMsg.textContent = "";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/seller/dashboard.html";
    } catch (err) {
      errorMsg.textContent = "Invalid login details";
      console.error(err);
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
