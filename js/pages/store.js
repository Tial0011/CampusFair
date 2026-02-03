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

let CART = [];
let SELLER = null;

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
  const seller = await fetchSeller();
  SELLER = seller;

  renderStoreHeader(seller);

  const products = await fetchSellerProducts();
  renderProducts(products);
  renderCartUI();
}

/* ===============================
   FETCH SELLER
================================ */
async function fetchSeller() {
  const ref = doc(db, "sellers", sellerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Seller not found");
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
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ===============================
   HEADER
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
   PRODUCTS
================================ */
function renderProducts(products) {
  const container = document.getElementById("products");

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
   CART LOGIC
================================ */
function addToCart(product) {
  const item = CART.find((p) => p.id === product.id);

  if (item) {
    item.qty += 1;
  } else {
    CART.push({ ...product, qty: 1 });
  }

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

/* expose qty handlers */
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;

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
