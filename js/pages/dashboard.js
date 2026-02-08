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
   SLUGIFY (Fallback - should use stored slug)
================================ */
function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ===============================
   AUTH GUARD
================================ */
auth.onAuthStateChanged((user) => {
  console.log("Auth state changed. User:", user ? user.uid : "No user");

  if (!user) {
    console.log("No user, redirecting to home");
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
   FETCH SELLER WITH DEBUGGING
================================ */
async function fetchSeller(uid) {
  console.log("Fetching seller with UID:", uid);
  const sellerRef = doc(db, "sellers", uid);
  const snap = await getDoc(sellerRef);

  console.log("Seller document exists:", snap.exists());

  if (!snap.exists()) {
    console.error("Seller document not found for UID:", uid);
    throw new Error("Seller profile not found. Please contact support.");
  }

  const sellerData = snap.data();
  console.log("Seller data:", sellerData);

  return sellerData;
}

/* ===============================
   BASE UI
================================ */
function renderBaseUI(storeLink, seller) {
  app.innerHTML = `
    <header class="header">
      <h2>Seller Dashboard</h2>
      <div class="store-info">
        <span>${seller.storeName}</span>
      </div>

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
      <p class="hint">Share this link with customers</p>
    </section>

    <section class="quick-stats">
      <div class="stat-card">
        <h3>Store Status</h3>
        <p class="status active">${seller.active ? "Active" : "Inactive"}</p>
      </div>
      <div class="stat-card">
        <h3>Products</h3>
        <p class="count">${seller.productCount || 0}</p>
      </div>
    </section>

    <section class="action-section">
      <a href="/seller/add-product.html" class="seller-btn primary">
        + Add New Product
      </a>
      <button id="refreshBtn" class="seller-btn secondary">
        Refresh Products
      </button>
    </section>

    <section class="products-section">
      <h2>My Products</h2>
      <div id="products">
        <p class="loading">Fetching products...</p>
      </div>
    </section>
  `;

  // Event listeners
  document.getElementById("logoutBtn").onclick = async () => {
    await auth.signOut();
    window.location.replace("/");
  };

  document.getElementById("copyBtn").onclick = () => {
    navigator.clipboard.writeText(storeLink);
    const btn = document.getElementById("copyBtn");
    btn.textContent = "Copied ✓";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 2000);
  };

  document.getElementById("refreshBtn").onclick = async () => {
    const productsContainer = document.getElementById("products");
    productsContainer.innerHTML =
      '<p class="loading">Refreshing products...</p>';
    try {
      const products = await fetchSellerProducts(auth.currentUser.uid);
      renderProducts(products);
    } catch (error) {
      productsContainer.innerHTML = `<p class="error">Failed to refresh: ${error.message}</p>`;
    }
  };
}

/* ===============================
   PRODUCTS
================================ */
async function fetchSellerProducts(uid) {
  console.log("Fetching products for seller UID:", uid);
  const q = query(collection(db, "products"), where("sellerId", "==", uid));
  const snap = await getDocs(q);
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log("Found products:", products.length);
  return products;
}

function renderProducts(products) {
  const box = document.getElementById("products");
  box.innerHTML = "";

  if (!products || !products.length) {
    box.innerHTML = `
      <div class="empty-state">
        <p>No products yet.</p>
        <p>Add your first product to start selling!</p>
        <a href="/seller/add-product.html" class="seller-btn">Add Product</a>
      </div>
    `;
    return;
  }

  box.className = "products-grid";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img src="${p.imageUrl || "/images/placeholder.jpg"}" alt="${p.name}" />
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="product-description">${p.description?.substring(0, 60) || ""}...</p>
        <div class="product-footer">
          <p class="price">₦${parseInt(p.price).toLocaleString()}</p>
          <div class="dashboard-actions">
            <a href="/seller/edit-product.html?id=${p.id}" class="edit-btn">Edit</a>
            <button class="delete-btn" data-id="${p.id}">Delete</button>
          </div>
        </div>
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
      if (!confirm("Are you sure you want to delete this product?")) return;

      const productId = btn.dataset.id;
      const productCard = btn.closest(".product-card");

      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        await deleteDoc(doc(db, "products", productId));
        productCard.remove();

        // Optional: Show success message
        showMessage("Product deleted successfully", "success");
      } catch (err) {
        console.error("Delete error:", err);
        btn.disabled = false;
        btn.textContent = "Delete";
        showMessage("Failed to delete product. Please try again.", "error");
      }
    };
  });
}

/* ===============================
   SHOW MESSAGE
================================ */
function showMessage(text, type = "info") {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;

  // Add to page
  document.body.appendChild(message);

  // Remove after 3 seconds
  setTimeout(() => {
    message.remove();
  }, 3000);
}

/* ===============================
   INIT DASHBOARD WITH ERROR HANDLING
================================ */
async function initDashboard(user) {
  try {
    console.log("Initializing dashboard for user:", user.uid);

    // Fetch seller data
    const seller = await fetchSeller(user.uid);

    // Use stored slug if available, otherwise generate one
    const storeSlug = seller.storeSlug || slugify(seller.storeName);
    const storeLink = `https://campusfair.netlify.app/s/${storeSlug}`;

    console.log("Store slug:", storeSlug);
    console.log("Store link:", storeLink);

    // Render the base UI with seller data
    renderBaseUI(storeLink, seller);

    // Fetch and render products
    const products = await fetchSellerProducts(user.uid);
    renderProducts(products);

    console.log("Dashboard loaded successfully");
  } catch (err) {
    console.error("Dashboard initialization error:", err);

    // Show detailed error message
    app.innerHTML = `
      <header class="header">
        <h2>Seller Dashboard</h2>
      </header>
      <div class="error-container">
        <h3>Failed to Load Dashboard</h3>
        <p>${err.message}</p>
        <div class="error-actions">
          <button id="retryBtn" class="seller-btn">Retry</button>
          <button id="logoutErrorBtn" class="seller-btn secondary">Logout</button>
        </div>
        <p class="hint">If this persists, please contact support</p>
      </div>
    `;

    // Add event listeners for error buttons
    document.getElementById("retryBtn").onclick = () => {
      renderLoadingUI();
      initDashboard(user);
    };

    document.getElementById("logoutErrorBtn").onclick = async () => {
      await auth.signOut();
      window.location.replace("/");
    };
  }
}
