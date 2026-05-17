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
   SEARCH + PAGINATION STATE
================================ */
let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];

let currentPage = 1;
const PRODUCTS_PER_PAGE = 8;

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

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
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

        <a href="/" class="seller-link">
          Back
        </a>
      </div>
    </header>

    <section>
      <div class="store-header">
        <div>
          <p class="store-name">${seller.storeName}</p>

          <p class="store-desc">
            ${seller.storeDescription || ""}
          </p>
        </div>
      </div>
    </section>

    <section>
      <h2>Products</h2>

      <!-- SEARCH -->
      <div class="search-box">
        <input
          type="text"
          id="productSearch"
          class="search-input"
          placeholder="Search products..."
        />
      </div>

      <!-- PRODUCTS -->
      <div id="products" class="products-grid"></div>

      <!-- PAGINATION -->
      <div id="pagination" class="pagination"></div>
    </section>
  `;
}

/* ===============================
   PRODUCTS
================================ */
function renderProducts(products) {
  ALL_PRODUCTS = products;
  FILTERED_PRODUCTS = products;

  const searchInput = document.getElementById("productSearch");

  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase().trim();

    FILTERED_PRODUCTS = ALL_PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(value),
    );

    currentPage = 1;

    renderProductPage();
  });

  renderProductPage();
}

function renderProductPage() {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (!FILTERED_PRODUCTS.length) {
    container.innerHTML = "<p>No products found.</p>";

    document.getElementById("pagination").innerHTML = "";

    return;
  }

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;

  const paginatedProducts = FILTERED_PRODUCTS.slice(start, end);

  paginatedProducts.forEach((p) => {
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

  renderPagination();
}

/* ===============================
   PAGINATION
================================ */
function renderPagination() {
  const pagination = document.getElementById("pagination");

  pagination.innerHTML = "";

  const totalPages = Math.ceil(FILTERED_PRODUCTS.length / PRODUCTS_PER_PAGE);

  if (totalPages <= 1) return;

  /* PREV BUTTON */
  const prevBtn = document.createElement("button");

  prevBtn.textContent = "← Prev";

  prevBtn.disabled = currentPage === 1;

  prevBtn.onclick = () => {
    currentPage--;
    renderProductPage();
  };

  pagination.appendChild(prevBtn);

  /* PAGE NUMBERS */
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");

    btn.textContent = i;

    if (i === currentPage) {
      btn.classList.add("active");
    }

    btn.onclick = () => {
      currentPage = i;
      renderProductPage();
    };

    pagination.appendChild(btn);
  }

  /* NEXT BUTTON */
  const nextBtn = document.createElement("button");

  nextBtn.textContent = "Next →";

  nextBtn.disabled = currentPage === totalPages;

  nextBtn.onclick = () => {
    currentPage++;
    renderProductPage();
  };

  pagination.appendChild(nextBtn);
}

/* ===============================
   CART LOGIC
================================ */
function addToCart(product) {
  const item = CART.find((p) => p.id === product.id);

  if (item) {
    item.qty += 1;
  } else {
    CART.push({
      ...product,
      qty: 1,
    });
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

  document.getElementById("openCart").onclick = () => {
    cart.classList.add("show");
  };

  document.getElementById("closeCart").onclick = () => {
    cart.classList.remove("show");
  };

  document.getElementById("checkoutBtn").onclick = checkout;
}

/* ===============================
   CHECKOUT
================================ */
function checkout() {
  if (!CART.length) {
    return alert("Cart is empty");
  }

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
