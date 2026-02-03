// js/pages/my-products.js

import { auth, db } from "../firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
================================ */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // 🔥 replace so BACK doesn’t return here
    window.location.replace("/");
    return;
  }

  renderLoading();
  const store = await getMyStore(user.uid);

  if (!store) {
    app.innerHTML = "<p>You have no store yet.</p>";
    return;
  }

  loadProducts(store.id);
});

/* ===============================
   LOADING UI
================================ */
function renderLoading() {
  app.innerHTML = `
    <h2>My Products</h2>
    <p class="loading">Loading your products...</p>
  `;
}

/* ===============================
   GET SELLER STORE
================================ */
async function getMyStore(userId) {
  const q = query(collection(db, "stores"), where("ownerId", "==", userId));

  const snap = await getDocs(q);
  if (snap.empty) return null;

  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/* ===============================
   LOAD PRODUCTS
================================ */
async function loadProducts(storeId) {
  const q = query(collection(db, "products"), where("storeId", "==", storeId));

  const snap = await getDocs(q);

  app.innerHTML = `<h2>My Products</h2>`;

  if (snap.empty) {
    app.innerHTML += "<p>You have not added any products yet.</p>";
    return;
  }

  const list = document.createElement("div");
  list.className = "products-grid";

  snap.forEach((docSnap) => {
    const product = { id: docSnap.id, ...docSnap.data() };
    list.appendChild(renderProductCard(product));
  });

  app.appendChild(list);
}

/* ===============================
   PRODUCT CARD
================================ */
function renderProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <img src="${product.imageUrl}" alt="${product.name}" />
    <h3>${product.name}</h3>
    <p class="price">₦${product.price}</p>
    <button class="delete-btn">Delete</button>
  `;

  card.querySelector(".delete-btn").onclick = async () => {
    if (!confirm("Delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", product.id));
      card.remove();
    } catch (err) {
      alert("Failed to delete product");
      console.error(err);
    }
  };

  return card;
}
