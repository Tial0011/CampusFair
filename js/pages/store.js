// js/pages/store.js

import { db } from "../core/firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");
const params = new URLSearchParams(window.location.search);
const sellerId = params.get("sellerId");

/* ===============================
   INIT
================================ */
if (!sellerId) {
  app.innerHTML = "<p>Store not found.</p>";
} else {
  loadStore();
}

/* ===============================
   LOAD STORE
================================ */
async function loadStore() {
  try {
    const seller = await fetchSeller();
    renderStoreHeader(seller);

    const products = await fetchSellerProducts();
    renderProducts(products, seller);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load store.</p>";
  }
}

/* ===============================
   FETCH SELLER
================================ */
async function fetchSeller() {
  const ref = doc(db, "sellers", sellerId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Seller not found");
  }

  return snap.data();
}

/* ===============================
   FETCH PRODUCTS
================================ */
async function fetchSellerProducts() {
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
   HEADER + STORE INFO
================================ */
function renderStoreHeader(seller) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>${seller.storeName}</h1>
      </div>

      <div class="header-right">
        <a href="/" class="seller-link">Back to CampusFair</a>
      </div>
    </header>

    <section>
      ${
        seller.bannerUrl
          ? `
        <div class="store-banner">
          <img src="${seller.bannerUrl}" alt="${seller.storeName}" />
        </div>
        `
          : ""
      }

      <div class="store-header">
        ${
          seller.logoUrl
            ? `
          <div class="store-logo">
            <img src="${seller.logoUrl}" alt="Store logo" />
          </div>
          `
            : ""
        }

        <div>
          <p class="store-name">${seller.storeName}</p>
          <p style="font-size:0.8rem;color:var(--muted);">
            ${seller.storeDescription || "Welcome to my store 👋🏽"}
          </p>
        </div>
      </div>
    </section>

    <section>
      <h2>Products</h2>
      <div id="products" class="products-grid"></div>
    </section>
  `;
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(products, seller) {
  const container = document.getElementById("products");

  if (!products || products.length === 0) {
    container.innerHTML = "<p>No products available yet.</p>";
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />

      <h3>${p.name}</h3>

      <p class="price">₦${p.price}</p>

      <button onclick="messageSeller('${seller.phone || ""}')">
        Message Seller
      </button>
    `;

    container.appendChild(card);
  });
}

/* ===============================
   MESSAGE SELLER
================================ */
window.messageSeller = function (phone) {
  if (!phone) {
    alert("Seller contact not available");
    return;
  }

  const text = encodeURIComponent("Hello, I’m interested in your product.");
  window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
};
