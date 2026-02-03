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
  try {
    const seller = await fetchSeller();
    SELLER = seller;

    renderStoreHeader(seller);

    const products = await fetchSellerProducts();
    renderProducts(products);
    renderCartUI();
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
  const products = [];

  snapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  return products;
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
      ${
        seller.bannerUrl
          ? `<div class="store-banner">
               <img src="${seller.bannerUrl}" />
             </div>`
          : ""
      }

      <div class="store-header">
        ${
          seller.logoUrl
            ? `<div class="store-logo">
                 <img src="${seller.logoUrl}" />
               </div>`
            : ""
        }

        <div>
          <p class="store-name">${seller.storeName}</p>
          <p class="store-desc">
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
   PRODUCTS
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
      <button class="add-btn">Add to Cart</button>
    `;

    card.querySelector(".add-btn").onclick = () => addToCart(p);
    container.appendChild(card);
  });
}

/* ===============================
   CART LOGIC
================================ */
function addToCart(product) {
  const exists = CART.find((p) => p.id === product.id);

  if (exists) {
    exists.qty += 1;
  } else {
    CART.push({ ...product, qty: 1 });
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
    const item = document.createElement("div");
    item.className = "cart-item";

    item.innerHTML = `
      <span>${p.name} × ${p.qty}</span>
      <strong>₦${p.price * p.qty}</strong>
    `;

    list.appendChild(item);
  });
}

/* ===============================
   CART UI (SLIDE UP)
================================ */
function renderCartUI() {
  const cart = document.createElement("div");
  cart.id = "cartPanel";
  cart.className = "cart-panel";

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
  if (!CART.length) {
    alert("Your cart is empty");
    return;
  }

  if (!SELLER.phone) {
    alert("Seller contact unavailable");
    return;
  }

  let message = `Hello, I’d like to order:\n\n`;

  CART.forEach((p) => {
    message += `• ${p.name} × ${p.qty} = ₦${p.price * p.qty}\n`;
  });

  message += `\nFrom ${SELLER.storeName} on CampusFair`;

  window.open(
    `https://wa.me/${SELLER.phone}?text=${encodeURIComponent(message)}`,
    "_blank",
  );
}
