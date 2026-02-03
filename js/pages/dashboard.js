// js/pages/dashboard.js

import { auth, db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
================================ */
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    // hard redirect → buyer page
    window.location.replace("/");
    return;
  }

  renderLoadingUI();
  initDashboard(user);
});

/* ===============================
   LOADING UI
================================ */
function renderLoadingUI() {
  app.innerHTML = `
    <header class="header">
      <h1>Seller Dashboard</h1>
    </header>

    <div class="loading">
      Loading your dashboard...
    </div>
  `;
}

/* ===============================
   BASE UI
================================ */
function renderBaseUI(user, storeLink) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>Seller Dashboard</h1>
      </div>

      <div class="header-right">
        <a href="${storeLink}" class="seller-link" target="_blank">
          View Store
        </a>

        <button id="logoutBtn" class="seller-btn">
          Logout
        </button>
      </div>
    </header>

    <section class="store-share">
      <p><strong>Your store link:</strong></p>

      <div class="copy-box">
        <input
          type="text"
          id="storeLinkInput"
          value="${storeLink}"
          readonly
        />
        <button id="copyStoreLink">Copy</button>
      </div>

      <small>Share this link to promote your store 🚀</small>
    </section>

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
      <div id="products">
        <p class="loading">Fetching products...</p>
      </div>
    </section>
  `;

  // logout
  document.getElementById("logoutBtn").onclick = async () => {
    await auth.signOut();
    window.location.replace("/");
  };

  // copy store link
  document.getElementById("copyStoreLink").onclick = () => {
    const input = document.getElementById("storeLinkInput");
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);

    const btn = document.getElementById("copyStoreLink");
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  };
}

/* ===============================
   FETCH SELLER INFO
================================ */
async function fetchSeller(uid) {
  const ref = doc(db, "sellers", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Seller record not found");
  }

  return snap.data();
}

/* ===============================
   FETCH PRODUCTS
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

  container.className = "products-grid";

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

        <button class="delete-btn" data-id="${p.id}">
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

      if (!confirm("Are you sure you want to delete this product?")) return;

      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        await deleteDoc(doc(db, "products", productId));
        btn.closest(".product-card").remove();
      } catch (err) {
        alert("Failed to delete product");
        console.error(err);
        btn.disabled = false;
        btn.textContent = "Delete";
      }
    };
  });
}

/* ===============================
   INIT DASHBOARD
================================ */
async function initDashboard(user) {
  try {
    const seller = await fetchSeller(user.uid);

    // build clean public link
    const storeLink = seller.storeSlug
      ? `https://campusfair.netlify.app/s/${seller.storeSlug}`
      : `https://campusfair.netlify.app/store.html?sellerId=${user.uid}`;

    renderBaseUI(user, storeLink);

    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load dashboard.</p>";
  }
}
