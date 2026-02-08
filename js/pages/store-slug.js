// js/pages/store-slug.js

import { db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   SLUG FROM URL
================================ */
const slug = window.location.pathname.split("/").filter(Boolean).pop();

let CART = [];
let SELLER = null;

/* ===============================
   SLUGIFY
================================ */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   INIT
================================ */
if (!slug) {
  app.innerHTML = "<p>Store not found.</p>";
} else {
  loadStoreBySlug();
}

/* ===============================
   LOAD STORE BY SLUG
================================ */
async function loadStoreBySlug() {
  app.innerHTML = "<p>Loading store...</p>";

  const sellersSnap = await getDocs(collection(db, "sellers"));
  let seller = null;

  sellersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (slugify(data.storeName) === slug) {
      seller = { id: docSnap.id, ...data };
    }
  });

  if (!seller) {
    app.innerHTML = "<h2>Store not found</h2>";
    return;
  }

  SELLER = seller;

  renderStoreHeader(seller);

  const products = await fetchSellerProducts(seller.id);
  renderProducts(products);
  renderCartUI();
}

/* ===============================
   FETCH PRODUCTS
================================ */
async function fetchSellerProducts(sellerId) {
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ===============================
   STORE HEADER (SAME AS store.js)
================================ */
function renderStoreHeader(seller) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>${seller.storeName}</h1>
      </div>

      <div class="header-right">
        <button id="openCart" class="seller-btn">
          Cart (<span id="cartCount">0</span>)
        </button>
        <a href="/" class="seller-link">Back</a>
      </div>
    </header>

    <section>
      <div class="store-header">
        <div>
          <p class="store-name">${seller.storeName}</p>
          <p class="store-desc">${seller.storeDescription || ""}</p>
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
   PRODUCTS (SAME AS store.js)
================================ */
function renderProducts(products) {
  const container = document.getElementById("products");

  if (!products.length) {
    container.innerHTML = "<p>No products yet.</p>";
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>
      <button>Add to Cart</button>
    `;

    card.querySelector("button").onclick = () => addToCart(p);
    container.appendChild(card);
  });
}

/* ===============================
   CART LOGIC (UNCHANGED)
================================ */
function addToCart(product) {
  const item = CART.find((p) => p.id === product.id);

  if (item) item.qty += 1;
  else CART.push({ ...product, qty: 1 });

  updateCartUI();
}

function increaseQty(id) {
  const item = CART.find((p) => p.id === id);
  item.qty += 1;
  updateCartUI();
}

function decreaseQty(id) {
  const item = CART.find((p) => p.id === id);
  item.qty -= 1;

  if (item.qty <= 0) {
    CART = CART.filter((p) => p.id !== id);
  }

  updateCartUI();
}

window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

function updateCartUI() {
  document.getElementById("cartCount").textContent = CART.reduce(
    (sum, p) => sum + p.qty,
    0,
  );

  const list = document.getElementById("cartItems");
  list.innerHTML = "";

  CART.forEach((p) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    row.innerHTML = `
      <span>${p.name}</span>

      <div class="cart-controls">
        <button onclick="window.decreaseQty('${p.id}')">−</button>
        <strong>${p.qty}</strong>
        <button onclick="window.increaseQty('${p.id}')">+</button>
      </div>

      <span>₦${p.price * p.qty}</span>
    `;

    list.appendChild(row);
  });
}

/* ===============================
   CART UI
================================ */
function renderCartUI() {
  const cart = document.createElement("div");
  cart.id = "cartPanel";

  cart.innerHTML = `
    <div class="cart-header">
      <h3>Your Cart</h3>
      <button id="closeCart">✕</button>
    </div>

    <div id="cartItems" class="cart-items"></div>

    <button id="checkoutBtn" class="seller-btn">
      Order on WhatsApp
    </button>
  `;

  document.body.appendChild(cart);

  document.getElementById("openCart").onclick = () =>
    cart.classList.add("show");

  document.getElementById("closeCart").onclick = () =>
    cart.classList.remove("show");

  document.getElementById("checkoutBtn").onclick = checkout;
}

/* ===============================
   CHECKOUT
================================ */
function checkout() {
  if (!CART.length) return alert("Cart is empty");

  let msg = "Hello, I’d like to order:\n\n";

  CART.forEach((p) => {
    msg += `• ${p.name} × ${p.qty} = ₦${p.price * p.qty}\n`;
  });

  msg += `\nFrom ${SELLER.storeName} on CampusFair`;

  window.open(
    `https://wa.me/${SELLER.phone}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
}
