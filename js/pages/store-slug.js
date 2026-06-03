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
   SEARCH + PAGINATION STATE
================================ */
let ALL_PRODUCTS = [];
let FILTERED_PRODUCTS = [];

let currentPage = 1;
const PRODUCTS_PER_PAGE = 8;

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
   LOADING UI
================================ */
function renderLoading() {
  app.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading(please Patient be )...</p>
    </div>
  `;
}

/* ===============================
   LOAD STORE BY SLUG
================================ */
async function loadStoreBySlug() {
  renderLoading();

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
   HEADER (+ SEARCH ADDED)
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

      <!-- SEARCH (ADDED) -->
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

      <!-- PAGINATION (ADDED) -->
      <div id="pagination" class="pagination"></div>
    </section>
  `;
}

/* ===============================
   PRODUCTS (UPDATED FOR SEARCH + PAGINATION)
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

  const paginated = FILTERED_PRODUCTS.slice(start, end);

  paginated.forEach((p) => {
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

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Prev";
  prevBtn.disabled = currentPage === 1;

  prevBtn.onclick = () => {
    currentPage--;
    renderProductPage();
  };

  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    if (i === currentPage) btn.classList.add("active");

    btn.onclick = () => {
      currentPage = i;
      renderProductPage();
    };

    pagination.appendChild(btn);
  }

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
   CART UPDATE
================================ */
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
