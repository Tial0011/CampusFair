import { db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

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
        <a href="/seller/login.html" class="seller-link">
          Seller Login
        </a>
        <a href="/seller/register.html" class="seller-btn">
          Become a Seller
        </a>
      </div>

      <input
        type="search"
        id="searchInput"
        placeholder="Search products on campus..."
      />
    </header>

    <section>
      <h2>Latest Products</h2>
      <div id="products" class="products-grid"></div>
    </section>
  `;
}

/* ===============================
   FETCH PRODUCTS + SELLERS
================================ */
async function fetchProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  const products = [];

  for (const docSnap of snapshot.docs) {
    const product = { id: docSnap.id, ...docSnap.data() };

    // fetch seller info using sellerId
    const sellerRef = doc(db, "sellers", product.sellerId);
    const sellerSnap = await getDoc(sellerRef);

    if (sellerSnap.exists()) {
      const seller = sellerSnap.data();
      product.storeName = seller.storeName;
      product.sellerPhone = seller.phone;
    } else {
      product.storeName = "Unknown Store";
      product.sellerPhone = "";
    }

    products.push(product);
  }

  return products;
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products yet.</p>";
    return;
  }

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const message = encodeURIComponent(
      `Hi, I’m interested in "${p.name}" (₦${p.price}) from ${p.storeName} on CampusFair.`,
    );

    const whatsappLink = p.sellerPhone
      ? `https://wa.me/${p.sellerPhone}?text=${message}`
      : "#";

    const storeLink = `/store.html?sellerId=${p.sellerId}`;

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />

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
   SEARCH
================================ */
function setupSearch(allProducts) {
  const input = document.getElementById("searchInput");

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();

    const filtered = allProducts.filter((p) =>
      `${p.name} ${p.description || ""}`.toLowerCase().includes(term),
    );

    renderProducts(filtered);
  });
}

/* ===============================
   INIT
================================ */
async function init() {
  renderBaseUI();

  try {
    const products = await fetchProducts();
    renderProducts(products);
    setupSearch(products);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load products.</p>";
  }
}

init();
