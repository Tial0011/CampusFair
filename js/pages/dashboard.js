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
      <h1>Seller Dashboard</h1>
    </header>
    <div class="loading">Loading your dashboard...</div>
  `;
}

/* ===============================
   SLUG GENERATOR (FROM STORE NAME)
================================ */
function generateSlug(storeName) {
  return storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   FETCH SELLER DATA
================================ */
async function fetchSeller(uid) {
  const ref = doc(db, "sellers", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Seller not found");

  return snap.data();
}

/* ===============================
   BASE UI
================================ */
function renderBaseUI(storeLink) {
  app.innerHTML = `
    <header class="header">
      <div class="header-left">
        <h1>Seller Dashboard</h1>
      </div>

      <div class="header-right">
        <a href="${storeLink}" class="seller-link" target="_blank">
          View Store
        </a>
        <button id="logoutBtn" class="seller-btn">Logout</button>
      </div>
    </header>

    <section class="store-link-box">
      <p><strong>Your Store Link</strong></p>
      <div class="copy-row">
        <input type="text" value="${storeLink}" readonly />
        <button id="copyLinkBtn">Copy</button>
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

  document.getElementById("copyLinkBtn").onclick = () => {
    navigator.clipboard.writeText(storeLink);
    document.getElementById("copyLinkBtn").textContent = "Copied ✓";
  };
}

/* ===============================
   FETCH PRODUCTS
================================ */
async function fetchSellerProducts(sellerId) {
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>You haven’t added any products yet.</p>";
    return;
  }

  container.className = "products-grid";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">₦${p.price}</p>

      <div class="dashboard-actions">
        <a href="/seller/edit-product.html?id=${p.id}">Edit</a>
        <button class="delete-btn" data-id="${p.id}">Delete</button>
      </div>
    `;

    container.appendChild(card);
  });

  setupDeleteButtons();
}

/* ===============================
   DELETE PRODUCT
================================ */
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this product?")) return;

      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        await deleteDoc(doc(db, "products", btn.dataset.id));
        btn.closest(".product-card").remove();
      } catch {
        btn.textContent = "Delete";
        btn.disabled = false;
        alert("Failed to delete");
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

    const slug = generateSlug(seller.storeName);
    const storeLink = `https://campusfair.netlify.app/s/${slug}`;

    renderBaseUI(storeLink);

    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);
  } catch (err) {
    console.error(err);
    app.innerHTML = "<p>Failed to load dashboard.</p>";
  }
}
