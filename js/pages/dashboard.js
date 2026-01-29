// js/pages/dashboard.js

import { auth, db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH CHECK
================================ */

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "/seller-login.html";
    return;
  }

  initDashboard(user.uid);
});

/* ===============================
   BASE UI
================================ */

function renderBaseUI(sellerId) {
  app.innerHTML = `
    <header class="header">
      <h1>Seller Dashboard</h1>

      <div class="header-actions">
        <a
          href="/store.html?sellerId=${sellerId}"
          class="view-store-btn"
          target="_blank"
        >
          View My Store
        </a>

        <button id="logoutBtn">Logout</button>
      </div>
    </header>

    <section>
      <h2>My Products</h2>
      <div id="products" class="products-grid"></div>
    </section>
  `;

  document.getElementById("logoutBtn").onclick = () => {
    auth.signOut();
  };
}

/* ===============================
   FETCH SELLER PRODUCTS
================================ */

async function fetchSellerProducts(sellerId) {
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
  );

  const snapshot = await getDocs(q);
  const products = [];

  snapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  return products;
}

/* ===============================
   RENDER PRODUCTS
================================ */

function renderProducts(products, sellerId) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products yet.</p>";
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />

      <h3>${p.name}</h3>

      <p class="price">₦${p.price}</p>

      <div class="dashboard-actions">
        <a
          href="/store.html?sellerId=${sellerId}"
          target="_blank"
          class="view-store-link"
        >
          View Store
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ===============================
   INIT
================================ */

async function initDashboard(sellerId) {
  renderBaseUI(sellerId);

  try {
    const products = await fetchSellerProducts(sellerId);
    renderProducts(products, sellerId);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load dashboard.</p>";
  }
}
