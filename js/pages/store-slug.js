import { db } from "../core/firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

// get store name from /s/{storeName}
const storeName = window.location.pathname.split("/s/")[1];

if (!storeName) {
  app.innerHTML = "<p>Store not found.</p>";
} else {
  loadStore(storeName.toLowerCase());
}

/* ===============================
   LOAD STORE BY NAME
================================ */
async function loadStore(storeNameLower) {
  try {
    const seller = await fetchSellerByName(storeNameLower);
    renderStoreHeader(seller);

    const products = await fetchSellerProducts(seller.id);
    renderProducts(products, seller);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Store not found.</p>";
  }
}

/* ===============================
   FETCH SELLER
================================ */
async function fetchSellerByName(storeNameLower) {
  const q = query(
    collection(db, "sellers"),
    where("storeNameLower", "==", storeNameLower),
  );

  const snap = await getDocs(q);

  if (snap.empty) throw new Error("Seller not found");

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
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
   RENDER STORE
================================ */
function renderStoreHeader(seller) {
  app.innerHTML = `
    <header class="header">
      <h1>${seller.storeName}</h1>
      <a href="/" class="seller-link">Back to CampusFair</a>
    </header>

    <section>
      <p>${seller.storeDescription}</p>
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

  if (products.length === 0) {
    container.innerHTML = "<p>No products yet.</p>";
    return;
  }

  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <img src="${p.imageUrl}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>

      <button onclick="messageSeller('${seller.phone}', '${p.name}', '${seller.storeName}')">
        Message Seller
      </button>
    `;

    container.appendChild(div);
  });
}

/* ===============================
   WHATSAPP
================================ */
window.messageSeller = function (phone, product, store) {
  const text = encodeURIComponent(
    `Hello, I’m interested in ${product} from ${store} on CampusFair`,
  );
  window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
};
