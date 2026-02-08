import { db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   GET SLUG FROM URL
================================ */
const slug = window.location.pathname.split("/").pop();

/* ===============================
   SLUG GENERATOR (SAME AS DASHBOARD)
================================ */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   LOAD STORE BY SLUG
================================ */
async function loadStore() {
  app.innerHTML = "<p class='loading'>Loading store...</p>";

  try {
    const sellersSnap = await getDocs(collection(db, "sellers"));

    let seller = null;

    sellersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const storeSlug = generateSlug(data.storeName);

      if (storeSlug === slug) {
        seller = { id: docSnap.id, ...data };
      }
    });

    if (!seller) {
      app.innerHTML = "<h2>Store not found</h2>";
      return;
    }

    renderStoreHeader(seller);
    loadProducts(seller.id);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load store</p>";
  }
}

/* ===============================
   STORE HEADER
================================ */
function renderStoreHeader(seller) {
  app.innerHTML = `
    <header class="store-header">
      <h1>${seller.storeName}</h1>
      <p>${seller.storeDescription}</p>
      <p class="contact">📞 ${seller.phone}</p>
    </header>

    <section>
      <h2>Products</h2>
      <div id="products" class="products-grid">
        <p class="loading">Loading products...</p>
      </div>
    </section>
  `;
}

/* ===============================
   LOAD PRODUCTS
================================ */
async function loadProducts(sellerId) {
  const productsBox = document.getElementById("products");

  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    productsBox.innerHTML = "<p>No products yet.</p>";
    return;
  }

  productsBox.innerHTML = "";

  snap.forEach((docSnap) => {
    const p = docSnap.data();

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>
      <a
        href="https://wa.me/${sellerPhone(p)}"
        target="_blank"
        class="buy-btn"
      >
        Buy on WhatsApp
      </a>
    `;

    productsBox.appendChild(card);
  });
}

/* ===============================
   FORMAT PHONE FOR WHATSAPP
================================ */
function sellerPhone(p) {
  return p.phone?.replace(/\D/g, "") || "";
}

/* ===============================
   INIT
================================ */
loadStore();
