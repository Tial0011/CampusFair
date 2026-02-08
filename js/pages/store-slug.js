import { db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   GET SLUG
================================ */
const slug = window.location.pathname.split("/").filter(Boolean).pop();

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
   LOAD STORE
================================ */
async function loadStore() {
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

  renderStore(seller);
  loadProducts(seller.id, seller.phone);
}

/* ===============================
   RENDER STORE
================================ */
function renderStore(seller) {
  app.innerHTML = `
    <header class="store-header">
      <h1>${seller.storeName}</h1>
      <p>${seller.storeDescription}</p>
      <p>📞 ${seller.phone}</p>
    </header>

    <section>
      <h2>Products</h2>
      <div id="products" class="products-grid">
        <p>Loading products...</p>
      </div>
    </section>
  `;
}

/* ===============================
   LOAD PRODUCTS
================================ */
async function loadProducts(sellerId, phone) {
  const box = document.getElementById("products");

  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    box.innerHTML = "<p>No products yet.</p>";
    return;
  }

  box.innerHTML = "";

  snap.forEach((docSnap) => {
    const p = docSnap.data();

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>
      <a
        href="https://wa.me/${phone.replace(/\D/g, "")}"
        target="_blank"
        class="buy-btn"
      >
        Buy on WhatsApp
      </a>
    `;

    box.appendChild(card);
  });
}

loadStore();
