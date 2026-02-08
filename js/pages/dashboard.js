import { auth, db } from "../core/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const app = document.getElementById("app");

/* ===============================
   AUTH GUARD
================================ */
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace("/");
    return;
  }

  renderLoadingUI();
  initDashboard(user);
});

/* ===============================
   LOADING UI
================================ */
function renderLoadingUI() {
  app.innerHTML = `
    <header class="header">
      <h2>Seller Dashboard</h2>
    </header>
    <div class="loading">Loading your dashboard...</div>
  `;
}

/* ===============================
   FETCH SELLER
================================ */
async function fetchSeller(uid) {
  const snap = await getDoc(doc(db, "sellers", uid));
  if (!snap.exists()) throw new Error("Seller not found");
  return snap.data();
}

/* ===============================
   BASE UI
================================ */
function renderBaseUI(storeLink) {
  app.innerHTML = `
    <header class="header">
      <h2>Seller Dashboard</h2>

      <div class="header-right">
        <a href="${storeLink}" target="_blank" class="seller-link">
          View Store
        </a>
        <button id="logoutBtn" class="seller-btn">Logout</button>
      </div>
    </header>

    <section class="store-link-box">
      <p><strong>Your Store Link</strong></p>
      <div class="copy-row">
        <input type="text" value="${storeLink}" readonly />
        <button id="copyBtn">Copy</button>
      </div>
    </section>

    <section>
      <a href="/seller/add-product.html" class="seller-btn">
        + Add New Product
      </a>
    </section>

    <section>
      <h2>My Products</h2>
      <div id="products">
        <p class="loading">Fetching products...</p>
      </div>
    </section>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    await auth.signOut();
    window.location.replace("/");
  };

  document.getElementById("copyBtn").onclick = () => {
    navigator.clipboard.writeText(storeLink);
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied ✓";
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  };
}

/* ===============================
   PRODUCTS
================================ */
async function fetchSellerProducts(uid) {
  const q = query(collection(db, "products"), where("sellerId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function renderProducts(products) {
  const box = document.getElementById("products");
  box.innerHTML = "";

  if (!products.length) {
    box.innerHTML = "<p>No products yet.</p>";
    return;
  }

  box.className = "products-grid";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>

      <div class="dashboard-actions">
        <a href="/seller/edit-product.html?id=${p.id}" class="edit-btn">
          Edit
        </a>
        <button class="delete-btn" data-id="${p.id}">
          Delete
        </button>
      </div>
    `;

    box.appendChild(card);
  });

  setupDeleteButtons();
}

/* ===============================
   DELETE PRODUCT
================================ */
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete product?")) return;

      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        await deleteDoc(doc(db, "products", btn.dataset.id));
        btn.closest(".product-card").remove();
      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.textContent = "Delete";
        alert("Failed to delete product");
      }
    };
  });
}

/* ===============================
   INIT
================================ */
async function initDashboard(user) {
  try {
    const seller = await fetchSeller(user.uid);

    // 🔒 USE STORED SLUG — DO NOT RECREATE
    if (!seller.storeSlug) {
      throw new Error("Store slug missing");
    }

    const storeLink = `https://campusfair.netlify.app/s/${seller.storeSlug}`;

    renderBaseUI(storeLink);

    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);
  } catch (err) {
    console.error(err);
    app.innerHTML = `
      <p style="color:red;padding:1rem">
        Failed to load dashboard. Please contact support.
      </p>
    `;
  }
}
