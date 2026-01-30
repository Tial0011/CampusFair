// js/pages/dashboard.js

import { auth, db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH CHECK
================================ */
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "/seller/login.html";
    return;
  }

  initDashboard(user);
});

/* ===============================
   BASE UI
================================ */
function renderBaseUI(user) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>Seller Dashboard</h1>
      </div>

      <div class="header-right">
        <a
          href="/store.html?sellerId=${user.uid}"
          class="seller-link"
          target="_blank"
        >
          View Store
        </a>

        <button id="logoutBtn" class="seller-btn">
          Logout
        </button>
      </div>
    </header>

    <section>
      <p class="seller-welcome">
        Welcome back 👋🏽 Manage your products below.
      </p>
    </section>

    <section>
      <a
        href="/seller/add-product.html"
        class="seller-btn"
        style="display:inline-block;"
      >
        + Add New Product
      </a>
    </section>

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

  snapshot.forEach((docSnap) => {
    products.push({ id: docSnap.id, ...docSnap.data() });
  });

  return products;
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>You haven’t added any products yet.</p>";
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
        <a href="/seller/edit-product.html?id=${p.id}">
          Edit
        </a>

        <button
          class="delete-btn"
          data-id="${p.id}"
        >
          Delete
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  setupDeleteButtons();
}

/* ===============================
   DELETE PRODUCT
================================ */
function setupDeleteButtons() {
  const buttons = document.querySelectorAll(".delete-btn");

  buttons.forEach((btn) => {
    btn.onclick = async () => {
      const productId = btn.dataset.id;

      const confirmDelete = confirm(
        "Are you sure you want to delete this product?",
      );

      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, "products", productId));
        btn.closest(".product-card").remove();
      } catch (err) {
        alert("Failed to delete product");
        console.error(err);
      }
    };
  });
}

/* ===============================
   INIT
================================ */
async function initDashboard(user) {
  renderBaseUI(user);

  try {
    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load dashboard.</p>";
  }
}
