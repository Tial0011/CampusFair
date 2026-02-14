// js/pages/home.js

import { db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

let allProducts = [];
let orderedProducts = [];
let currentPage = 1;
const PAGE_SIZE = 10;

/* ===============================
   INJECT CSS
================================ */
const style = document.createElement("style");
style.innerHTML = `
  .pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 30px 0;
  }

  .pagination button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
  }

  .pagination button.active {
    background: #000;
    color: #fff;
  }

  .pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .product-card img {
    background: #f2f2f2;
    min-height: 180px;
    object-fit: cover;
  }
`;
document.head.appendChild(style);

/* ===============================
   BASE UI
================================ */
function renderBaseUI() {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>CampusFair</h1>
      </div>

      <div class="header-right">
        <a id="sellerLogin" class="seller-link">Seller Login</a>
        <a id="sellerRegister" class="seller-btn">Become a Seller</a>
      </div>

      <input
        type="search"
        id="searchInput"
        placeholder="Search products on campus..."
      />
    </header>

    <section>
      <h2>Latest Products</h2>

      <div id="products" class="products-grid">
        <p>Loading products...</p>
      </div>

      <div id="pagination" class="pagination"></div>
    </section>
  `;

  document.getElementById("sellerLogin").onclick = () => {
    window.location.replace("/seller/login.html");
  };

  document.getElementById("sellerRegister").onclick = () => {
    window.location.replace("/seller/register.html");
  };
}

/* ===============================
   FETCH ALL DATA (FAST)
================================ */
async function fetchAllProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const products = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const sellerIds = [...new Set(products.map((p) => p.sellerId))];
  const sellerPromises = sellerIds.map((id) => getDoc(doc(db, "sellers", id)));

  const sellerSnaps = await Promise.all(sellerPromises);

  const sellerMap = {};
  sellerSnaps.forEach((snap, i) => {
    if (snap.exists()) {
      sellerMap[sellerIds[i]] = snap.data();
    }
  });

  products.forEach((p) => {
    const seller = sellerMap[p.sellerId];
    p.storeName = seller?.storeName || "Unknown Store";
    p.sellerPhone = seller?.phone || "";
  });

  return products;
}

/* ===============================
   FAIR GLOBAL ORDER (NO DUPES)
================================ */
function buildFairOrder(products) {
  const bySeller = {};

  products.forEach((p) => {
    if (!bySeller[p.sellerId]) bySeller[p.sellerId] = [];
    bySeller[p.sellerId].push(p);
  });

  const sellers = Object.keys(bySeller);
  const result = [];
  let added = true;

  // round-robin
  while (added) {
    added = false;
    for (const s of sellers) {
      if (bySeller[s].length > 0) {
        result.push(bySeller[s].shift());
        added = true;
      }
    }
  }

  return result;
}

/* ===============================
   PAGINATION LOGIC
================================ */
function getPageProducts(list, page) {
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return list.slice(start, end);
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products found.</p>";
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const message = encodeURIComponent(
      `Hello, I’m interested in your ${p.name} from ${p.storeName} on CampusFair.`,
    );

    const whatsappLink = p.sellerPhone
      ? `https://wa.me/${p.sellerPhone}?text=${message}`
      : "#";

    const storeLink = `/store.html?sellerId=${p.sellerId}`;

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" loading="lazy" />
      <h3>${p.name}</h3>
      <p class="store-name">
        Sold by <a href="${storeLink}">${p.storeName}</a>
      </p>
      <p class="price">₦${p.price}</p>
      <button ${!p.sellerPhone ? "disabled" : ""}>
        Order on WhatsApp
      </button>
    `;

    if (p.sellerPhone) {
      card.querySelector("button").onclick = () => {
        window.open(whatsappLink, "_blank");
      };
    }

    container.appendChild(card);
  });
}

/* ===============================
   RENDER PAGINATION
================================ */
function renderPagination(list) {
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => goToPage(currentPage - 1, list);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => goToPage(i, list);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1, list);
  container.appendChild(nextBtn);
}

/* ===============================
   NAVIGATION
================================ */
function goToPage(page, list = orderedProducts) {
  currentPage = page;
  const pageProducts = getPageProducts(list, page);
  renderProducts(pageProducts);
  renderPagination(list);
}

/* ===============================
   SEARCH (ALL DATA)
================================ */
function setupSearch() {
  const input = document.getElementById("searchInput");

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();

    if (!term) {
      currentPage = 1;
      goToPage(1, orderedProducts);
      return;
    }

    const filtered = orderedProducts.filter((p) =>
      `${p.name} ${p.description || ""}`.toLowerCase().includes(term),
    );

    currentPage = 1;
    goToPage(1, filtered);
  });
}

/* ===============================
   INIT
================================ */
async function init() {
  renderBaseUI();

  try {
    allProducts = await fetchAllProducts();
    orderedProducts = buildFairOrder(allProducts);

    goToPage(1, orderedProducts);
    setupSearch();
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load products.</p>";
  }
}

init();
